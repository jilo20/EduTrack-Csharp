// ============================================================================
// FILE:    Services/AuthService.cs
// OWNER:   Bazar, Angelo
// WBS:     4.1 Login, 4.2 Account Lockout, 4.3 Verify Invite ID / Forgot Password, 4.4 Register
// PURPOSE: All login and account rules. Database work goes through the repositories.
//
// RULES:
//   - Login: a wrong password adds 1 to LoginAttempts. At 5 the account is locked for 15 minutes.
//   - Login: a successful login resets LoginAttempts to 0. Inactive users cannot log in.
//   - Verify: the invite ID must exist in RegisteredIds with IsUsed = false.
//   - Register: the role is copied from the invite, the password is hashed, the invite is marked used.
//   - Forgot Password: a valid emailed link lets an active account reset its password.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Services
{
    public class AuthService(
        IUserRepository users,
        IInviteRepository invites,
        IUnitOfWork uow,
        TokenService tokens,
        IPasswordHasher<User> hasher,
        AuditLogService audit,
        NotificationService notifications,
        PasswordResetMail resetMail,
        ILogger<AuthService> logger)
    {
        private const int MaxAttempts = 5;
        private static readonly TimeSpan LockTime = TimeSpan.FromMinutes(15);

        // 4.1 Login, 4.2 Account Lockout
        public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginDto dto)
        {
            var user = await users.GetByEmailAsync(dto.Email.Trim().ToLowerInvariant());
            if (user is null)
                return Fail.Unauthorized("Invalid email or password.");

            var now = DateTime.UtcNow;
            if (user.LockUntil > now)
                return Fail.Locked($"Account locked after {MaxAttempts} wrong tries. Try again in {Math.Ceiling((user.LockUntil.Value - now).TotalMinutes)} minute(s).");
            if (user.LockUntil is not null)
            {
                user.LockUntil = null;
                user.LoginAttempts = 0;
            }

            var check = hasher.VerifyHashedPassword(user, user.Password, dto.Password);
            if (check == PasswordVerificationResult.Failed)
            {
                user.LoginAttempts++;
                if (user.LoginAttempts >= MaxAttempts)
                {
                    user.LoginAttempts = MaxAttempts;
                    user.LockUntil = now.Add(LockTime);
                }
                await uow.SaveChangesAsync();
                var left = MaxAttempts - user.LoginAttempts;
                return left > 0
                    ? Fail.Unauthorized($"Invalid email or password. {left} tries left.")
                    : Fail.Locked($"Account locked for {LockTime.TotalMinutes:0} minutes after {MaxAttempts} wrong tries.");
            }

            if (user.Status != "active")
                return Fail.Forbidden("This account is inactive. Contact the admin.");

            user.LoginAttempts = 0;
            if (check == PasswordVerificationResult.SuccessRehashNeeded)
                user.Password = hasher.HashPassword(user, dto.Password);
            await uow.SaveChangesAsync();
            return BuildAuthResponse(user);
        }

        // 4.3 Verify Invite ID
        public async Task<ServiceResult<VerifyInviteResultDto>> VerifyInviteAsync(VerifyIdDto dto)
        {
            var invite = await invites.GetUnusedAsync(dto.IdNumber.Trim());
            return new VerifyInviteResultDto(invite is not null, invite?.Role?.Name);
        }

        // 4.4 Register
        public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterDto dto)
        {
            var invite = await invites.GetUnusedAsync(dto.IdNumber.Trim());
            if (invite is null)
                return Fail.BadRequest("This ID is not valid or has already been used.");

            var email = dto.Email.Trim().ToLowerInvariant();
            if (await users.EmailExistsAsync(email))
                return Fail.Conflict("This email is already registered.");
            if (await users.IdNumberExistsAsync(invite.IdNumber))
                return Fail.Conflict("This ID already has an account.");

            var user = new User
            {
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = email,
                IdNumber = invite.IdNumber,
                RoleId = invite.RoleId,
                Role = invite.Role,
                Password = "",
                Status = "active",
            };
            user.Password = hasher.HashPassword(user, dto.Password);
            invite.IsUsed = true;
            users.Add(user);
            await uow.SaveChangesAsync();   // one save: the user and the used invite are stored together
            return BuildAuthResponse(user);
        }

        public async Task<ServiceResult<OkResultDto>> RequestPasswordResetAsync(RequestPasswordResetDto dto)
        {
            if (resetMail.Enabled)
            {
                var user = await users.GetByEmailAsync(dto.Email.Trim().ToLowerInvariant());
                if (user?.Status == "active") await resetMail.SendAsync(user);
                else logger.LogInformation("Password reset email skipped because no active account matched.");
            }
            else logger.LogInformation("Password reset email skipped because local Mailpit is disabled.");
            return new OkResultDto(true);
        }

        // 4.3 Forgot Password, step 2: set the new password.
        public async Task<ServiceResult<OkResultDto>> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var reset = resetMail.Read(dto.Token);
            if (reset is null) return Fail.BadRequest("This reset link is invalid or expired.");
            var user = await users.GetByEmailAsync(reset.Value.Email);
            if (user is null || user.Status != "active" || !resetMail.Matches(user, reset.Value.Fingerprint))
                return Fail.BadRequest("This reset link is invalid or expired.");

            user.Password = hasher.HashPassword(user, dto.Password);
            user.LoginAttempts = 0;    // a reset also unlocks an account locked by wrong tries
            user.LockUntil = null;
            audit.Log("PASSWORD_RESET", user, $"Password reset with Forgot Password for {user.Email}");
            notifications.Notify(user.Id, "Password changed",
                "Your password was reset with Forgot Password. If this wasn't you, contact the admin.", "warning");
            try
            {
                await uow.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Fail.BadRequest("This reset link is invalid or expired.");
            }
            return new OkResultDto(true);
        }

        // 4.5: the logged-in user. Lets the frontend check that a saved session is still valid.
        public async Task<ServiceResult<UserDto>> MeAsync(Caller caller)
        {
            var user = await users.GetByIdAsync(caller.Id);
            if (user is null || user.Status != "active") return Fail.Unauthorized("Your session is no longer valid.");
            return UserDto.From(user);
        }

        private AuthResponseDto BuildAuthResponse(User user) =>
            new(tokens.CreateToken(user, user.Role!.Name), UserDto.From(user));
    }
}

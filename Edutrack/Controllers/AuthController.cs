// ============================================================================
// FILE:    Controllers/AuthController.cs
// OWNER:   Bazar, Angelo
// WBS:     4.1 Login API, 4.2 Account Lockout, 4.3 Verify Invite ID API, 4.4 Register API
// PURPOSE: Login and registration.
//
// ENDPOINTS TO BUILD:
//   POST /api/auth/login      body: LoginDto      -> AuthResponseDto { token, user }
//   POST /api/auth/verify-id  body: VerifyIdDto   -> { valid, role }
//   POST /api/auth/register   body: RegisterDto   -> AuthResponseDto
//   GET  /api/auth/me         (logged in)         -> UserDto
// RULES:
//   - Login: wrong password adds 1 to User.LoginAttempts. At 5, set User.LockUntil and refuse login until then.
//   - Login: a successful login resets LoginAttempts to 0. Inactive users cannot log in.
//   - Verify: the ID must exist in RegisteredIds with IsUsed = false.
//   - Register: copy the role from the invite, hash the password, then set the invite IsUsed = true.
// USES: Services/TokenService.cs, Dtos/Auth/*
//
// ============================================================================

using Edutrack.Data;
using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Controllers
{
    [ApiController]
    [Route("/api/auth")]
    public class AuthController(EduTrackContext db, TokenService tokens, IPasswordHasher<User> hasher) : ControllerBase
    {
        private const int MaxAttempts = 5;
        private static readonly TimeSpan LockTime = TimeSpan.FromMinutes(15);

        // 4.1 Login, 4.2 Account Lockout
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == email);
            if (user is null)
                return Unauthorized(new { error = "Invalid email or password." });

            var now = DateTime.UtcNow;
            if (user.LockUntil > now)
                return StatusCode(StatusCodes.Status423Locked,
                    new { error = $"Account locked after {MaxAttempts} wrong tries. Try again in {Math.Ceiling((user.LockUntil.Value - now).TotalMinutes)} minute(s)." });
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
                await db.SaveChangesAsync();
                var left = MaxAttempts - user.LoginAttempts;
                return left > 0
                    ? Unauthorized(new { error = $"Invalid email or password. {left} tries left." })
                    : StatusCode(StatusCodes.Status423Locked, new { error = $"Account locked for {LockTime.TotalMinutes:0} minutes after {MaxAttempts} wrong tries." });
            }

            if (user.Status != "active")
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "This account is inactive. Contact the admin." });

            user.LoginAttempts = 0;
            if (check == PasswordVerificationResult.SuccessRehashNeeded)
                user.Password = hasher.HashPassword(user, dto.Password);
            await db.SaveChangesAsync();

            return Ok(BuildAuthResponse(user));
        }

        // 4.3 Verify Invite ID
        [HttpPost("verify-id")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyId(VerifyIdDto dto)
        {
            var invite = await FindInvite(dto.IdNumber);
            return Ok(new { valid = invite is not null, role = invite?.Role?.Name });
        }

        // 4.4 Register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var invite = await FindInvite(dto.IdNumber);
            if (invite is null)
                return BadRequest(new { error = "This ID is not valid or has already been used." });

            var email = dto.Email.Trim().ToLowerInvariant();
            if (await db.Users.AnyAsync(u => u.Email == email))
                return Conflict(new { error = "This email is already registered." });
            if (await db.Users.AnyAsync(u => u.IdNumber == invite.IdNumber))
                return Conflict(new { error = "This ID already has an account." });

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
            db.Users.Add(user);
            await db.SaveChangesAsync();   // one save: the user and the used invite are stored together

            return Ok(BuildAuthResponse(user));
        }

        // 4.5: the logged-in user, read from the token. Lets the frontend check that a saved session is still valid.
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            if (!int.TryParse(User.Identity?.Name, out var id)) return Unauthorized();
            var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            if (user is null || user.Status != "active") return Unauthorized();
            return Ok(new UserDto(user.Id, user.FirstName, user.LastName, user.Email, user.Role!.Name, user.IdNumber, user.Status));
        }

        private Task<RegisteredId?> FindInvite(string idNumber) =>
            db.RegisteredIds.Include(r => r.Role)
                .FirstOrDefaultAsync(r => r.IdNumber == idNumber.Trim() && !r.IsUsed);

        private AuthResponseDto BuildAuthResponse(User user)
        {
            var role = user.Role!.Name;
            return new AuthResponseDto(tokens.CreateToken(user, role),
                new UserDto(user.Id, user.FirstName, user.LastName, user.Email, role, user.IdNumber, user.Status));
        }
    }
}

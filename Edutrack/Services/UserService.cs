// ============================================================================
// FILE:    Services/UserService.cs
// OWNER:   Bazar, Angelo
// WBS:     6.1 Add / Edit, 6.2 Deactivate, 6.3 Lists
// PURPOSE: Admin manages user accounts; teachers can list the student pool.
// ============================================================================

using System.Security.Cryptography;
using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;
using Microsoft.AspNetCore.Identity;

namespace Edutrack.Services
{
    public class UserService(
        IUserRepository users,
        IInviteRepository invites,
        IUnitOfWork uow,
        IPasswordHasher<User> hasher,
        AuditLogService audit)
    {
        private static readonly string[] Roles = ["Admin", "Teacher", "Student"];

        // 6.3 Lists. Teachers may only ask for active students (the enrollment student pool).
        public async Task<ServiceResult<List<UserDto>>> ListAsync(string? role, Caller caller)
        {
            if (role is not null && !Roles.Contains(role, StringComparer.OrdinalIgnoreCase))
                return Fail.BadRequest("role must be Admin, Teacher, or Student.");
            if (!caller.IsAdmin && !string.Equals(role, "Student", StringComparison.OrdinalIgnoreCase))
                return Fail.Forbidden("Teachers can only list students.");

            var list = await users.ListAsync(role, activeOnly: !caller.IsAdmin);
            return list.Select(UserDto.From).ToList();
        }

        // 6.1 Add
        public async Task<ServiceResult<UserDto>> CreateAsync(CreateUserDto dto, Caller caller)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (await users.EmailExistsAsync(email))
                return Fail.Conflict("This email is already registered.");
            var role = await users.GetRoleAsync(dto.RoleId);
            if (role is null)
                return Fail.BadRequest("Unknown role.");

            var user = new User
            {
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = email,
                IdNumber = await NewIdNumber(),
                RoleId = role.Id,
                Role = role,
                Password = "",
                Status = "active",
            };
            user.Password = hasher.HashPassword(user, dto.Password);
            users.Add(user);
            await audit.Log("USER_CREATED", caller, $"Created {role.Name} account for {user.FirstName} {user.LastName} ({user.Email})");
            await uow.SaveChangesAsync();
            return ServiceResult<UserDto>.Created(UserDto.From(user), "/api/users");
        }

        // 6.1 Edit
        public async Task<ServiceResult<UserDto>> UpdateAsync(int id, UpdateUserDto dto, Caller caller)
        {
            var user = await users.GetByIdAsync(id);
            if (user is null)
                return Fail.NotFound("User not found.");

            var email = dto.Email.Trim().ToLowerInvariant();
            if (await users.EmailExistsAsync(email, exceptUserId: id))
                return Fail.Conflict("This email is already used by another account.");
            var role = await users.GetRoleAsync(dto.RoleId);
            if (role is null)
                return Fail.BadRequest("Unknown role.");
            if (caller.Id == id && (dto.Status != "active" || role.Name != "Admin"))
                return Fail.BadRequest("You cannot deactivate yourself or remove your own Admin role.");

            user.FirstName = dto.FirstName.Trim();
            user.LastName = dto.LastName.Trim();
            user.Email = email;
            user.RoleId = role.Id;
            user.Role = role;
            user.Status = dto.Status;
            await audit.Log("USER_UPDATED", caller, $"Updated account of {user.FirstName} {user.LastName} ({user.Email}, {role.Name}, {user.Status})");
            await uow.SaveChangesAsync();
            return UserDto.From(user);
        }

        // 6.2 Deactivate. The row is kept so grades, attendance, and logs still point to it.
        public async Task<ServiceResult<UserDto>> DeactivateAsync(int id, Caller caller)
        {
            var user = await users.GetByIdAsync(id);
            if (user is null)
                return Fail.NotFound("User not found.");
            if (caller.Id == id)
                return Fail.BadRequest("You cannot deactivate your own account.");

            user.Status = "inactive";
            await audit.Log("USER_DEACTIVATED", caller, $"Deactivated account for {user.FirstName} {user.LastName}");
            await uow.SaveChangesAsync();
            return UserDto.From(user);
        }

        // Same format as invite IDs: year + 6 random digits, unique among users and invites.
        private async Task<string> NewIdNumber()
        {
            while (true)
            {
                var id = $"{DateTime.UtcNow.Year}{RandomNumberGenerator.GetInt32(100000, 1000000)}";
                if (!await users.IdNumberExistsAsync(id) && !await invites.NumberExistsAsync(id))
                    return id;
            }
        }
    }
}

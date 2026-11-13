// ============================================================================
// FILE:    Controllers/UsersController.cs
// OWNER:   Bazar, Angelo
// WBS:     6.1 Users API: Add / Edit, 6.2 Deactivate, 6.3 Lists
// PURPOSE: Admin manages user accounts.
//
// ENDPOINTS TO BUILD (Admin only, except: a Teacher may GET ?role=Student to pick students to enroll):
//   GET    /api/users?role=Student|Teacher  -> UserDto[]   (also used as the student pool for enrollment)
//   POST   /api/users        body: CreateUserDto -> UserDto
//   PUT    /api/users/{id}   body: UpdateUserDto -> UserDto
//   DELETE /api/users/{id}   -> sets Status = "inactive" (do NOT delete the row)
// RULES: email must be unique. Write an audit log for create, update, and deactivate.
//
// ============================================================================

using System.Security.Cryptography;
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
    [Route("/api/users")]
    public class UsersController(EduTrackContext db, IPasswordHasher<User> hasher, AuditLogService audit) : ControllerBase
    {
        private static readonly string[] Roles = ["Admin", "Teacher", "Student"];

        // 6.3 Lists. Teachers may only ask for students (the enrollment student pool).
        [HttpGet]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetAll([FromQuery] string? role)
        {
            if (role is not null && !Roles.Contains(role, StringComparer.OrdinalIgnoreCase))
                return BadRequest(new { error = "role must be Admin, Teacher, or Student." });
            if (!User.IsInRole("Admin") && !string.Equals(role, "Student", StringComparison.OrdinalIgnoreCase))
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Teachers can only list students." });

            var query = db.Users.Include(u => u.Role).AsQueryable();
            if (role is not null) query = query.Where(u => u.Role!.Name == role);
            if (!User.IsInRole("Admin")) query = query.Where(u => u.Status == "active");

            var users = await query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ToListAsync();
            return Ok(users.Select(UserDto.From));
        }

        // 6.1 Add
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(CreateUserDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (await db.Users.AnyAsync(u => u.Email == email))
                return Conflict(new { error = "This email is already registered." });
            var role = await db.Roles.FindAsync(dto.RoleId);
            if (role is null)
                return BadRequest(new { error = "Unknown role." });

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
            db.Users.Add(user);
            await audit.Log("USER_CREATED", User, $"Created {role.Name} account for {user.FirstName} {user.LastName} ({user.Email})");
            await db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), null, UserDto.From(user));
        }

        // 6.1 Edit
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, UpdateUserDto dto)
        {
            var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            if (user is null)
                return NotFound(new { error = "User not found." });

            var email = dto.Email.Trim().ToLowerInvariant();
            if (await db.Users.AnyAsync(u => u.Email == email && u.Id != id))
                return Conflict(new { error = "This email is already used by another account." });
            var role = await db.Roles.FindAsync(dto.RoleId);
            if (role is null)
                return BadRequest(new { error = "Unknown role." });
            if (IsMe(id) && (dto.Status != "active" || role.Name != "Admin"))
                return BadRequest(new { error = "You cannot deactivate yourself or remove your own Admin role." });

            user.FirstName = dto.FirstName.Trim();
            user.LastName = dto.LastName.Trim();
            user.Email = email;
            user.RoleId = role.Id;
            user.Role = role;
            user.Status = dto.Status;
            await audit.Log("USER_UPDATED", User, $"Updated account of {user.FirstName} {user.LastName} ({user.Email}, {role.Name}, {user.Status})");
            await db.SaveChangesAsync();

            return Ok(UserDto.From(user));
        }

        // 6.2 Deactivate. The row is kept so grades, attendance, and logs still point to it.
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            if (user is null)
                return NotFound(new { error = "User not found." });
            if (IsMe(id))
                return BadRequest(new { error = "You cannot deactivate your own account." });

            user.Status = "inactive";
            await audit.Log("USER_DEACTIVATED", User, $"Deactivated account for {user.FirstName} {user.LastName}");
            await db.SaveChangesAsync();

            return Ok(UserDto.From(user));
        }

        private bool IsMe(int id) => User.Identity?.Name == id.ToString();

        // Same format as invite IDs: year + 6 random digits, unique among users and invites.
        private async Task<string> NewIdNumber()
        {
            while (true)
            {
                var id = $"{DateTime.UtcNow.Year}{RandomNumberGenerator.GetInt32(100000, 1000000)}";
                if (!await db.Users.AnyAsync(u => u.IdNumber == id) && !await db.RegisteredIds.AnyAsync(r => r.IdNumber == id))
                    return id;
            }
        }
    }
}

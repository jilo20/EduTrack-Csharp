using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using Edutrack.Data;
using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace Edutrack.Controllers;

// OWNER: Lopez, Mary Vincent — WBS 5.1
[ApiController]
[Authorize(Roles = "Admin")]
[Route("/api/registeredid")]
public class RegisteredIdController(EduTrackContext db, AuditLogService audit) : ControllerBase
{
    public record GenerateInviteDto([Range(2, 3)] int RoleId);

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await db.RegisteredIds
        .OrderByDescending(r => r.CreatedAt)
        .Select(r => new RegisteredIdDto(r.Id, r.IdNumber, r.Role!.Name, r.IsUsed, r.CreatedAt))
        .ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetId(int id)
    {
        var invite = await db.RegisteredIds.Where(r => r.Id == id)
            .Select(r => new RegisteredIdDto(r.Id, r.IdNumber, r.Role!.Name, r.IsUsed, r.CreatedAt))
            .FirstOrDefaultAsync();
        return invite is null ? NotFound(new { error = "Invite not found." }) : Ok(invite);
    }

    [HttpPost]
    public async Task<IActionResult> Create(GenerateInviteDto dto)
    {
        var role = await db.Roles.FindAsync(dto.RoleId);
        if (role is null || (role.Name != "Student" && role.Name != "Teacher"))
            return BadRequest(new { error = "Select a Student or Teacher role." });

        // Retry if the database's unique index detects a concurrent collision.
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var number = $"{DateTime.UtcNow.Year}{RandomNumberGenerator.GetInt32(100000, 1000000)}";
            if (await db.RegisteredIds.AnyAsync(r => r.IdNumber == number) ||
                await db.Users.AnyAsync(u => u.IdNumber == number)) continue;
            var invite = new RegisteredId { IdNumber = number, RoleId = role.Id };
            db.RegisteredIds.Add(invite);
            await audit.Log("INVITE_GENERATED", User, $"Generated {role.Name} invite {number}");
            try
            {
                await db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetId), new { id = invite.Id },
                    new RegisteredIdDto(invite.Id, number, role.Name, false, invite.CreatedAt));
            }
            catch (DbUpdateException ex) when (ex.InnerException is MySqlException { Number: 1062 })
            {
                db.ChangeTracker.Clear();
            }
        }
        return Conflict(new { error = "Could not generate a unique invite. Please try again." });
    }
}

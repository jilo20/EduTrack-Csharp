// ============================================================================
// FILE:    Services/AuditLogService.cs
// OWNER:   Bazar, Angelo
// WBS:     13.1 Audit Logging
// PURPOSE: One place to record important actions.
//
// TO BUILD: Log(action, actor, details) that adds an AuditLog row (who, what, when).
// ACTIONS TO LOG: invite generated, user created / updated / deactivated, grade entered or changed,
//                 attendance marked, semester ended.
//
// ============================================================================

using System.Security.Claims;
using Edutrack.Data;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Services
{
    public class AuditLogService(EduTrackContext db)
    {
        // Adds an AuditLog row. It is saved by the caller's SaveChangesAsync, together with the change it describes.
        public async Task Log(string action, ClaimsPrincipal actor, string details)
        {
            var id = actor.UserId();
            var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            db.AuditLogs.Add(new AuditLog
            {
                Action = action,
                ActorId = user?.Id,
                ActorName = user is null ? "Unknown" : $"{user.FirstName} {user.LastName}",
                ActorRole = user?.Role?.Name,
                Details = details.Length > 500 ? details[..500] : details,
            });
        }
    }
}

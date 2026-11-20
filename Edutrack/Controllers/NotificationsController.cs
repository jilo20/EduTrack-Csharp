// ============================================================================
// FILE:    Controllers/NotificationsController.cs
// OWNER:   Lopez, Mary Vincent
// WBS:     12.2 Notifications API
// PURPOSE: A user's notifications.
//
// ENDPOINTS (logged-in user, own notifications only):
//   GET    /api/notifications             -> NotificationDto[] (newest first)
//   POST   /api/notifications/{id}/read
//   POST   /api/notifications/read-all
//   DELETE /api/notifications             (clear all)
//
// ============================================================================

using Edutrack.Data;
using Edutrack.Dtos;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Controllers
{
    [ApiController]
    [Route("/api/notifications")]
    [Authorize]
    public class NotificationsController(EduTrackContext db) : ControllerBase
    {
        // Newest first. Capped at the latest 100 so the bell panel stays light.
        [HttpGet]
        public async Task<IActionResult> GetMine()
        {
            var userId = User.UserId();
            var list = await db.Notifications.Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt).ThenByDescending(n => n.Id).Take(100)
                .Select(n => new NotificationDto(n.Id, n.Title, n.Message, n.Type, n.Status, n.CreatedAt))
                .ToListAsync();
            return Ok(list);
        }

        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var userId = User.UserId();
            // Someone else's notification answers 404, so ids cannot be probed.
            var n = await db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (n is null) return NotFound(new { error = "Notification not found." });
            n.Status = "read";
            await db.SaveChangesAsync();
            return Ok(new NotificationDto(n.Id, n.Title, n.Message, n.Type, n.Status, n.CreatedAt));
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var userId = User.UserId();
            var updated = await db.Notifications.Where(n => n.UserId == userId && n.Status == "unread")
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.Status, "read"));
            return Ok(new { ok = true, updated });
        }

        [HttpDelete]
        public async Task<IActionResult> ClearAll()
        {
            var userId = User.UserId();
            var deleted = await db.Notifications.Where(n => n.UserId == userId).ExecuteDeleteAsync();
            return Ok(new { ok = true, deleted });
        }
    }
}

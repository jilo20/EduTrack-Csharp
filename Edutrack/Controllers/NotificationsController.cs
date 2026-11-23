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
//
// ARCHITECTURE: Controller -> Service -> Repository. This controller only calls the service;
//               the rules are in Services/, the database work in Repositories/.
// ============================================================================

using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edutrack.Controllers
{
    [Route("/api/notifications")]
    [Authorize]
    public class NotificationsController(NotificationService notifications) : ApiControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetMine() => Respond(await notifications.ListAsync(Caller));

        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkRead(int id) => Respond(await notifications.MarkReadAsync(id, Caller));

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead() => Respond(await notifications.MarkAllReadAsync(Caller));

        [HttpDelete]
        public async Task<IActionResult> ClearAll() => Respond(await notifications.ClearAsync(Caller));
    }
}

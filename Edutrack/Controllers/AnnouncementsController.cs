// ============================================================================
// FILE:    Controllers/AnnouncementsController.cs
// OWNER:   Bazar, Angelo
// WBS:     12.1 Announcements API
// PURPOSE: Announcements.
//
// ENDPOINTS TO BUILD:
//   GET  /api/announcements   -> AnnouncementDto[] for the logged-in user's role and classes
//   POST /api/announcements   body: CreateAnnouncementDto
// RULES:
//   - Admin broadcast: target = all, teachers, or students.
//   - Teacher: can only post to one of their own classes (SectionId).
//   - Priority is normal, high, or urgent.
//   - Create a notification for every user who should see it.
//
//
// ARCHITECTURE: Controller -> Service -> Repository. This controller only calls the service;
//               the rules are in Services/, the database work in Repositories/.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edutrack.Controllers
{
    [Route("/api/announcements")]
    [Authorize]
    public class AnnouncementsController(AnnouncementService announcements) : ApiControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() => Respond(await announcements.ListAsync(Caller));

        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Create(CreateAnnouncementDto dto) => Respond(await announcements.CreateAsync(dto, Caller));
    }
}

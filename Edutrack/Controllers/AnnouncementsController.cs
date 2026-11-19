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
// ============================================================================

using Edutrack.Data;
using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Controllers
{
    [ApiController]
    [Route("/api/announcements")]
    [Authorize]
    public class AnnouncementsController(EduTrackContext db, NotificationService notifications) : ControllerBase
    {
        private static readonly string[] Priorities = ["normal", "high", "urgent"];
        private static readonly string[] Targets = ["all", "teachers", "students"];

        // What the logged-in user should see: admins see everything; teachers and students see the
        // broadcasts for their role plus the announcements of their own classes. Newest first.
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var me = User.UserId();
            var query = db.Announcements.Include(a => a.Section).Include(a => a.Author).AsQueryable();
            if (User.IsInRole("Teacher"))
                query = query.Where(a => (a.SectionId == null && (a.Target == "all" || a.Target == "teachers"))
                                         || (a.SectionId != null && a.Section!.TeacherId == me));
            else if (User.IsInRole("Student"))
            {
                var mine = db.Enrollments.Where(e => e.StudentId == me).Select(e => e.SectionId);
                query = query.Where(a => (a.SectionId == null && (a.Target == "all" || a.Target == "students"))
                                         || (a.SectionId != null && mine.Contains(a.SectionId.Value)));
            }
            var list = await query.OrderByDescending(a => a.Date).ThenByDescending(a => a.Id).Take(200).ToListAsync();
            return Ok(list.Select(AnnouncementDto.From));
        }

        // Admin: broadcast to all / teachers / students (or post to one class). Teacher: post to one of their own classes.
        // Everyone who should see it gets a notification.
        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Create(CreateAnnouncementDto dto)
        {
            var priority = (dto.Priority ?? "normal").Trim().ToLowerInvariant();
            var target = (dto.Target ?? "all").Trim().ToLowerInvariant();
            if (!Priorities.Contains(priority)) return BadRequest(new { error = "Priority must be normal, high, or urgent." });
            if (!Targets.Contains(target)) return BadRequest(new { error = "Target must be all, teachers, or students." });

            Section? section = null;
            if (dto.SectionId is not null)
            {
                section = await db.Sections.FindAsync(dto.SectionId.Value);
                if (section is null) return NotFound(new { error = "Class not found." });
                if (!User.CanManage(section)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "You can only post to your own classes." });
                target = "students";
            }
            else if (!User.IsAdmin())
                return BadRequest(new { error = "Teachers must choose one of their classes." });

            var me = User.UserId();
            var announcement = new Announcement
            {
                Title = dto.Title.Trim(), Content = dto.Content.Trim(), Priority = priority, Target = target,
                SectionId = section?.Id, Section = section, AuthorId = me, Author = await db.Users.FindAsync(me),
            };
            db.Announcements.Add(announcement);

            List<int> recipients;
            if (section is not null)
            {
                recipients = await db.Enrollments.Where(e => e.SectionId == section.Id && e.Student!.Status == "active").Select(e => e.StudentId).ToListAsync();
                if (section.TeacherId != me) recipients.Add(section.TeacherId);
            }
            else
            {
                var users = db.Users.Where(u => u.Status == "active" && u.Id != me);
                if (target == "teachers") users = users.Where(u => u.Role!.Name == "Teacher");
                if (target == "students") users = users.Where(u => u.Role!.Name == "Student");
                recipients = await users.Select(u => u.Id).ToListAsync();
            }
            var where = section is null ? "" : $" ({section.CodeName})";
            notifications.NotifyMany(recipients, $"New announcement{where}: {announcement.Title}", announcement.Content,
                priority == "urgent" ? "warning" : "announcement");

            await db.SaveChangesAsync();
            return Created($"/api/announcements/{announcement.Id}", AnnouncementDto.From(announcement));
        }
    }
}

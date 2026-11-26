// ============================================================================
// FILE:    Services/AnnouncementService.cs
// OWNER:   Bazar, Angelo
// WBS:     12.1 Announcements API
// PURPOSE: Who sees which announcements, who may post where, and who gets notified.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class AnnouncementService(
        IAnnouncementRepository announcements,
        IClassRepository classes,
        IUserRepository users,
        IUnitOfWork uow,
        NotificationService notifications)
    {
        private static readonly string[] Priorities = ["normal", "high", "urgent"];
        private static readonly string[] Targets = ["all", "teachers", "students"];
        private const int MaxListed = 200;

        // Admins see everything; teachers and students see the broadcasts for their role
        // plus the announcements of their own classes. Newest first.
        public async Task<ServiceResult<List<AnnouncementDto>>> ListAsync(Caller caller)
        {
            var list = caller.IsTeacher ? await announcements.ListForTeacherAsync(caller.Id, MaxListed)
                : caller.IsStudent ? await announcements.ListForStudentAsync(caller.Id, MaxListed)
                : await announcements.ListAllAsync(MaxListed);
            return list.Select(AnnouncementDto.From).ToList();
        }

        // Admin: broadcast to all / teachers / students (or post to one class). Teacher: post to one of their own classes.
        // Everyone who should see it gets a notification.
        public async Task<ServiceResult<AnnouncementDto>> CreateAsync(CreateAnnouncementDto dto, Caller caller)
        {
            var priority = (dto.Priority ?? "normal").Trim().ToLowerInvariant();
            var target = (dto.Target ?? "all").Trim().ToLowerInvariant();
            if (!Priorities.Contains(priority)) return Fail.BadRequest("Priority must be normal, high, or urgent.");
            if (!Targets.Contains(target)) return Fail.BadRequest("Target must be all, teachers, or students.");

            Section? section = null;
            if (dto.SectionId is not null)
            {
                section = await classes.GetByIdAsync(dto.SectionId.Value);
                if (section is null) return Fail.NotFound("Class not found.");
                if (!caller.CanManage(section)) return Fail.Forbidden("You can only post to your own classes.");
                target = "students";
            }
            else if (!caller.IsAdmin)
                return Fail.BadRequest("Teachers must choose one of their classes.");

            var announcement = new Announcement
            {
                Title = dto.Title.Trim(), Content = dto.Content.Trim(), Priority = priority, Target = target,
                SectionId = section?.Id, Section = section, AuthorId = caller.Id, Author = await users.GetByIdAsync(caller.Id),
            };
            announcements.Add(announcement);

            List<int> recipients;
            if (section is not null)
            {
                recipients = await classes.GetActiveStudentIdsAsync(section.Id);
                if (section.TeacherId != caller.Id) recipients.Add(section.TeacherId);
            }
            else
            {
                var role = target switch { "teachers" => "Teacher", "students" => "Student", _ => null };
                recipients = await users.GetActiveUserIdsAsync(role, exceptUserId: caller.Id);
            }
            var where = section is null ? "" : $" ({section.CodeName})";
            notifications.NotifyMany(recipients, $"New announcement{where}: {announcement.Title}", announcement.Content,
                priority == "urgent" ? "warning" : "announcement");

            await uow.SaveChangesAsync();
            return ServiceResult<AnnouncementDto>.Created(AnnouncementDto.From(announcement), $"/api/announcements/{announcement.Id}");
        }
    }
}

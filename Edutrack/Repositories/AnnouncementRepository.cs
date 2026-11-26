// ============================================================================
// FILE:    Repositories/AnnouncementRepository.cs
// PURPOSE: Database access for Announcements. Queries only; the service decides which list a user gets.
// ============================================================================

using Edutrack.Data;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Repositories
{
    public interface IAnnouncementRepository
    {
        Task<List<Announcement>> ListAllAsync(int take);
        // Broadcasts to "all" / "teachers" plus posts in the teacher's own classes.
        Task<List<Announcement>> ListForTeacherAsync(int teacherId, int take);
        // Broadcasts to "all" / "students" plus posts in the student's enrolled classes.
        Task<List<Announcement>> ListForStudentAsync(int studentId, int take);
        void Add(Announcement announcement);
    }

    public class AnnouncementRepository(EduTrackContext db) : IAnnouncementRepository
    {
        private IQueryable<Announcement> WithDetails() =>
            db.Announcements.Include(a => a.Section).Include(a => a.Author);

        private static Task<List<Announcement>> NewestFirst(IQueryable<Announcement> query, int take) =>
            query.OrderByDescending(a => a.Date).ThenByDescending(a => a.Id).Take(take).ToListAsync();

        public Task<List<Announcement>> ListAllAsync(int take) => NewestFirst(WithDetails(), take);

        public Task<List<Announcement>> ListForTeacherAsync(int teacherId, int take) =>
            NewestFirst(WithDetails().Where(a => (a.SectionId == null && (a.Target == "all" || a.Target == "teachers"))
                                                 || (a.SectionId != null && a.Section!.TeacherId == teacherId)), take);

        public Task<List<Announcement>> ListForStudentAsync(int studentId, int take)
        {
            var mine = db.Enrollments.Where(e => e.StudentId == studentId).Select(e => e.SectionId);
            return NewestFirst(WithDetails().Where(a => (a.SectionId == null && (a.Target == "all" || a.Target == "students"))
                                                        || (a.SectionId != null && mine.Contains(a.SectionId.Value))), take);
        }

        public void Add(Announcement announcement) => db.Announcements.Add(announcement);
    }
}

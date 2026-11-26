// ============================================================================
// FILE:    Repositories/AttendanceRepository.cs
// PURPOSE: Database access for Attendance records. Queries only; no business rules.
// ============================================================================

using Edutrack.Data;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Repositories
{
    public interface IAttendanceRepository
    {
        Task<Dictionary<int, Attendance>> GetForDateAsync(int sectionId, DateOnly date, IReadOnlyCollection<int>? studentIds = null);
        Task<List<Attendance>> ListBySectionAsync(int sectionId);
        Task<List<Attendance>> ListByStudentAsync(int studentId);
        Task<List<string>> GetStudentStatusesAsync(int studentId, IReadOnlyCollection<int> sectionIds);
        Task<List<string>> GetAllStatusesExceptAsync(string excludedStatus);
        void Add(Attendance record);
    }

    public class AttendanceRepository(EduTrackContext db) : IAttendanceRepository
    {
        // studentId -> that day's record, for one class.
        public Task<Dictionary<int, Attendance>> GetForDateAsync(int sectionId, DateOnly date, IReadOnlyCollection<int>? studentIds = null)
        {
            var query = db.Attendances.Where(a => a.SectionId == sectionId && a.Date == date);
            if (studentIds is not null) query = query.Where(a => studentIds.Contains(a.StudentId));
            return query.ToDictionaryAsync(a => a.StudentId);
        }

        public Task<List<Attendance>> ListBySectionAsync(int sectionId) =>
            db.Attendances.Where(a => a.SectionId == sectionId).ToListAsync();

        public Task<List<Attendance>> ListByStudentAsync(int studentId) =>
            db.Attendances.Where(a => a.StudentId == studentId).OrderBy(a => a.Date).ToListAsync();

        public Task<List<string>> GetStudentStatusesAsync(int studentId, IReadOnlyCollection<int> sectionIds) =>
            db.Attendances.AsNoTracking().Where(a => a.StudentId == studentId && sectionIds.Contains(a.SectionId))
                .Select(a => a.Status).ToListAsync();

        public Task<List<string>> GetAllStatusesExceptAsync(string excludedStatus) =>
            db.Attendances.Where(a => a.Status != excludedStatus).Select(a => a.Status).ToListAsync();

        public void Add(Attendance record) => db.Attendances.Add(record);
    }
}

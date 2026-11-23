// ============================================================================
// FILE:    Repositories/ClassRepository.cs
// PURPOSE: Database access for classes (Sections) and their Enrollments. Queries only; no business rules.
// ============================================================================

using Edutrack.Data;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Repositories
{
    public interface IClassRepository
    {
        Task<Section?> GetByIdAsync(int id);
        Task<Section?> GetWithTeacherAsync(int id);
        Task<int> CountStudentsAsync(int sectionId);
        Task<List<(Section Section, int StudentCount)>> ListWithStudentCountsAsync(int? teacherId);
        Task<List<Section>> ListAllAsync();
        Task<List<Section>> ListByTeacherAsync(int teacherId);
        Task<List<Section>> ListForStudentAsync(int studentId);
        Task<List<Section>> ListForStudentWithTeacherAsync(int studentId);
        Task<List<int>> GetSectionIdsForStudentAsync(int studentId);
        Task<int> CountActiveAsync();
        void Add(Section section);

        Task<List<User>> GetStudentsAsync(int sectionId);
        Task<List<int>> GetEnrolledStudentIdsAsync(int sectionId, IReadOnlyCollection<int> studentIds);
        Task<List<int>> GetActiveStudentIdsAsync(int sectionId);
        Task<Dictionary<int, int>> GetEnrollmentCountsAsync();
        Task<int> CountDistinctStudentsAsync(IReadOnlyCollection<int> sectionIds);
        void AddEnrollments(int sectionId, IEnumerable<int> studentIds);
    }

    public class ClassRepository(EduTrackContext db) : IClassRepository
    {
        public async Task<Section?> GetByIdAsync(int id) => await db.Sections.FindAsync(id);

        public Task<Section?> GetWithTeacherAsync(int id) =>
            db.Sections.Include(s => s.Teacher).FirstOrDefaultAsync(s => s.Id == id);

        public Task<int> CountStudentsAsync(int sectionId) => db.Enrollments.CountAsync(e => e.SectionId == sectionId);

        // Active classes first, newest first, each with its number of enrolled students.
        public async Task<List<(Section Section, int StudentCount)>> ListWithStudentCountsAsync(int? teacherId)
        {
            var query = db.Sections.Include(s => s.Teacher).AsQueryable();
            if (teacherId is not null) query = query.Where(s => s.TeacherId == teacherId);
            var rows = await query.OrderBy(s => s.Status == "completed").ThenByDescending(s => s.CreatedAt)
                .Select(s => new { Section = s, Count = db.Enrollments.Count(e => e.SectionId == s.Id) })
                .ToListAsync();
            return rows.Select(r => (r.Section, r.Count)).ToList();
        }

        public Task<List<Section>> ListAllAsync() => db.Sections.OrderBy(s => s.CodeName).ToListAsync();

        public Task<List<Section>> ListByTeacherAsync(int teacherId) =>
            db.Sections.Where(s => s.TeacherId == teacherId).OrderBy(s => s.CodeName).ToListAsync();

        public Task<List<Section>> ListForStudentAsync(int studentId) =>
            db.Enrollments.Where(e => e.StudentId == studentId).Select(e => e.Section!).OrderBy(s => s.CourseProgram).ToListAsync();

        public Task<List<Section>> ListForStudentWithTeacherAsync(int studentId) =>
            db.Sections.AsNoTracking()
                .Where(s => db.Enrollments.Any(e => e.StudentId == studentId && e.SectionId == s.Id))
                .Include(s => s.Teacher)
                .OrderBy(s => s.CourseProgram).ThenBy(s => s.Id)
                .ToListAsync();

        public Task<List<int>> GetSectionIdsForStudentAsync(int studentId) =>
            db.Enrollments.Where(e => e.StudentId == studentId).Select(e => e.SectionId).ToListAsync();

        public Task<int> CountActiveAsync() => db.Sections.CountAsync(s => s.Status == "active");

        public void Add(Section section) => db.Sections.Add(section);

        public Task<List<User>> GetStudentsAsync(int sectionId) =>
            db.Enrollments.Where(e => e.SectionId == sectionId).Select(e => e.Student!)
                .OrderBy(s => s.LastName).ThenBy(s => s.FirstName).ToListAsync();

        public Task<List<int>> GetEnrolledStudentIdsAsync(int sectionId, IReadOnlyCollection<int> studentIds) =>
            db.Enrollments.Where(e => e.SectionId == sectionId && studentIds.Contains(e.StudentId)).Select(e => e.StudentId).ToListAsync();

        public Task<List<int>> GetActiveStudentIdsAsync(int sectionId) =>
            db.Enrollments.Where(e => e.SectionId == sectionId && e.Student!.Status == "active").Select(e => e.StudentId).ToListAsync();

        public Task<Dictionary<int, int>> GetEnrollmentCountsAsync() =>
            db.Enrollments.GroupBy(e => e.SectionId).Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

        public Task<int> CountDistinctStudentsAsync(IReadOnlyCollection<int> sectionIds) =>
            db.Enrollments.Where(e => sectionIds.Contains(e.SectionId)).Select(e => e.StudentId).Distinct().CountAsync();

        public void AddEnrollments(int sectionId, IEnumerable<int> studentIds) =>
            db.Enrollments.AddRange(studentIds.Select(id => new Enrollment { SectionId = sectionId, StudentId = id }));
    }
}

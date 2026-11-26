// ============================================================================
// FILE:    Repositories/AssessmentRepository.cs
// PURPOSE: Database access for Assessments and Scores. Queries only; no business rules.
// ============================================================================

using Edutrack.Data;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Repositories
{
    public interface IAssessmentRepository
    {
        Task<Assessment?> GetWithSectionAsync(int id);
        Task<List<Assessment>> ListBySectionAsync(int sectionId);
        Task<List<Assessment>> ListBySectionWithScoresAsync(int sectionId);
        Task<List<Assessment>> ListForSectionsAsync(IReadOnlyCollection<int> sectionIds);
        Task<int> CountForSectionsAsync(IReadOnlyCollection<int> sectionIds);
        void Add(Assessment assessment);

        Task<List<Score>> GetScoresBySectionAsync(int sectionId);
        Task<Dictionary<int, Score>> GetScoresByStudentAsync(int assessmentId, IReadOnlyCollection<int> studentIds);
        Task<List<Score>> GetStudentScoresAsync(int studentId);
        Task<List<Score>> GetStudentScoresInSectionsAsync(int studentId, IReadOnlyCollection<int> sectionIds);
        Task<List<Score>> GetLatestStudentScoresAsync(int studentId, IReadOnlyCollection<int> sectionIds, int count);
        void AddScore(Score score);
    }

    public class AssessmentRepository(EduTrackContext db) : IAssessmentRepository
    {
        public Task<Assessment?> GetWithSectionAsync(int id) =>
            db.Assessments.Include(a => a.Section).FirstOrDefaultAsync(a => a.Id == id);

        public Task<List<Assessment>> ListBySectionAsync(int sectionId) =>
            db.Assessments.Where(a => a.SectionId == sectionId).OrderBy(a => a.CreatedAt).ToListAsync();

        public Task<List<Assessment>> ListBySectionWithScoresAsync(int sectionId) =>
            db.Assessments.Where(a => a.SectionId == sectionId).Include(a => a.Scores).OrderBy(a => a.CreatedAt).ToListAsync();

        public Task<List<Assessment>> ListForSectionsAsync(IReadOnlyCollection<int> sectionIds) =>
            db.Assessments.AsNoTracking().Where(a => sectionIds.Contains(a.SectionId))
                .Include(a => a.Section).OrderByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id).ToListAsync();

        public Task<int> CountForSectionsAsync(IReadOnlyCollection<int> sectionIds) =>
            db.Assessments.CountAsync(a => sectionIds.Contains(a.SectionId));

        public void Add(Assessment assessment) => db.Assessments.Add(assessment);

        public Task<List<Score>> GetScoresBySectionAsync(int sectionId) =>
            db.Scores.Where(s => s.Assessment!.SectionId == sectionId).ToListAsync();

        public Task<Dictionary<int, Score>> GetScoresByStudentAsync(int assessmentId, IReadOnlyCollection<int> studentIds) =>
            db.Scores.Where(s => s.AssessmentId == assessmentId && studentIds.Contains(s.StudentId)).ToDictionaryAsync(s => s.StudentId);

        public Task<List<Score>> GetStudentScoresAsync(int studentId) =>
            db.Scores.Where(s => s.StudentId == studentId).Include(s => s.Assessment)
                .OrderBy(s => s.Assessment!.CreatedAt).ToListAsync();

        public Task<List<Score>> GetStudentScoresInSectionsAsync(int studentId, IReadOnlyCollection<int> sectionIds) =>
            db.Scores.AsNoTracking().Include(s => s.Assessment)
                .Where(s => s.StudentId == studentId && sectionIds.Contains(s.Assessment!.SectionId)).ToListAsync();

        public Task<List<Score>> GetLatestStudentScoresAsync(int studentId, IReadOnlyCollection<int> sectionIds, int count) =>
            db.Scores.AsNoTracking().Include(s => s.Assessment).ThenInclude(a => a!.Section)
                .Where(s => s.StudentId == studentId && sectionIds.Contains(s.Assessment!.SectionId))
                .OrderByDescending(s => s.UpdatedAt).ThenByDescending(s => s.Id).Take(count).ToListAsync();

        public void AddScore(Score score) => db.Scores.Add(score);
    }
}

// ============================================================================
// FILE:    Services/AssessmentService.cs
// OWNER:   Bazar, Angelo
// WBS:     8.1 Assessments API, 8.2 Scores API
// PURPOSE: Assessment and score rules: class ownership, category check, perfect-score limit,
//          one score per student, audit log for every new or changed grade.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class AssessmentService(
        IClassRepository classes,
        IAssessmentRepository assessments,
        IUnitOfWork uow,
        AuditLogService audit)
    {
        // 8.1 Create an assessment. Its type must be one of the class's grading categories.
        public async Task<ServiceResult<AssessmentDto>> CreateAsync(CreateAssessmentDto dto, Caller caller)
        {
            var section = await classes.GetByIdAsync(dto.SectionId);
            if (section is null) return Fail.NotFound("Class not found.");
            if (!caller.CanManage(section)) return Fail.Forbidden("This is not your class.");
            if (section.Status == "completed") return Fail.BadRequest("This class has ended.");

            var type = section.Weights.Keys.FirstOrDefault(k => string.Equals(k, dto.Type.Trim(), StringComparison.OrdinalIgnoreCase));
            if (type is null)
                return Fail.BadRequest($"Type must be one of this class's categories: {string.Join(", ", section.Weights.Keys)}.");

            var assessment = new Assessment { SectionId = section.Id, Title = dto.Title.Trim(), Type = type, PerfectScore = dto.PerfectScore };
            assessments.Add(assessment);
            await uow.SaveChangesAsync();
            return ServiceResult<AssessmentDto>.Created(
                new AssessmentDto(assessment.Id, assessment.SectionId, assessment.Title, assessment.Type, assessment.PerfectScore),
                $"/api/assessments/{assessment.Id}");
        }

        // 8.2 Save scores. One score per student (an existing one is updated). Every new or changed grade is audit logged.
        public async Task<ServiceResult<SaveScoresResultDto>> SubmitScoresAsync(int id, SubmitScoresDto dto, Caller caller)
        {
            var assessment = await assessments.GetWithSectionAsync(id);
            if (assessment is null) return Fail.NotFound("Assessment not found.");
            var section = assessment.Section!;
            if (!caller.CanManage(section)) return Fail.Forbidden("This is not your class.");
            if (section.Status == "completed") return Fail.BadRequest("This class has ended. Grades are final.");

            if (dto.Scores.GroupBy(s => s.StudentId).Any(g => g.Count() > 1))
                return Fail.BadRequest("Each student can only appear once.");
            var tooHigh = dto.Scores.Where(s => s.Score > assessment.PerfectScore).Select(s => s.StudentId).ToList();
            if (tooHigh.Count > 0)
                return Fail.BadRequest($"A score cannot be higher than the perfect score ({assessment.PerfectScore}). Student ids: {string.Join(", ", tooHigh)}.");

            var ids = dto.Scores.Select(s => s.StudentId).ToList();
            var students = (await classes.GetStudentsAsync(section.Id)).Where(s => ids.Contains(s.Id)).ToDictionary(s => s.Id);
            var notEnrolled = ids.Where(i => !students.ContainsKey(i)).ToList();
            if (notEnrolled.Count > 0)
                return Fail.BadRequest($"These students are not enrolled in this class: {string.Join(", ", notEnrolled)}.");

            var existing = await assessments.GetScoresByStudentAsync(id, ids);
            int added = 0, changed = 0;
            foreach (var entry in dto.Scores)
            {
                var name = $"{students[entry.StudentId].FirstName} {students[entry.StudentId].LastName}";
                if (existing.TryGetValue(entry.StudentId, out var score))
                {
                    if (score.Value == entry.Score) continue;
                    var reason = string.IsNullOrWhiteSpace(dto.Reason) ? "" : $" Reason: {dto.Reason.Trim()}";
                    await audit.Log("GRADE_CHANGED", caller, $"Grade changed from {score.Value:0.##} to {entry.Score:0.##} for {name} on \"{assessment.Title}\".{reason}");
                    score.Value = entry.Score;
                    score.UpdatedAt = DateTime.UtcNow;
                    changed++;
                }
                else
                {
                    assessments.AddScore(new Score { AssessmentId = id, StudentId = entry.StudentId, Value = entry.Score });
                    await audit.Log("GRADE_ENTERED", caller, $"Grade {entry.Score:0.##}/{assessment.PerfectScore} entered for {name} on \"{assessment.Title}\"");
                    added++;
                }
            }
            await uow.SaveChangesAsync();
            return new SaveScoresResultDto(id, added + changed, added, changed);
        }
    }
}

// ============================================================================
// FILE:    Controllers/AssessmentsController.cs
// OWNER:   Bazar, Angelo
// WBS:     8.1 Assessments API, 8.2 Scores API
// PURPOSE: Assessments and scores.
//
// ENDPOINTS TO BUILD (Teacher / Admin):
//   POST /api/assessments              body: CreateAssessmentDto -> AssessmentDto
//   POST /api/assessments/{id}/scores  body: SubmitScoresDto
// RULES:
//   - A score cannot be higher than the assessment's perfect score.
//   - One score per student per assessment (update it if it already exists).
//   - Write an audit log for every new grade and every grade change (old -> new).
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
    [Route("/api/assessments")]
    [Authorize(Roles = "Admin,Teacher")]
    public class AssessmentsController(EduTrackContext db, AuditLogService audit) : ControllerBase
    {
        // 8.1 Create an assessment. Its type must be one of the class's grading categories.
        [HttpPost]
        public async Task<IActionResult> Create(CreateAssessmentDto dto)
        {
            var section = await db.Sections.FindAsync(dto.SectionId);
            if (section is null) return NotFound(new { error = "Class not found." });
            if (!User.CanManage(section)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "This is not your class." });
            if (section.Status == "completed") return BadRequest(new { error = "This class has ended." });

            var type = section.Weights.Keys.FirstOrDefault(k => string.Equals(k, dto.Type.Trim(), StringComparison.OrdinalIgnoreCase));
            if (type is null)
                return BadRequest(new { error = $"Type must be one of this class's categories: {string.Join(", ", section.Weights.Keys)}." });

            var assessment = new Assessment { SectionId = section.Id, Title = dto.Title.Trim(), Type = type, PerfectScore = dto.PerfectScore };
            db.Assessments.Add(assessment);
            await db.SaveChangesAsync();
            return Created($"/api/assessments/{assessment.Id}",
                new AssessmentDto(assessment.Id, assessment.SectionId, assessment.Title, assessment.Type, assessment.PerfectScore));
        }

        // 8.2 Save scores. One score per student (an existing one is updated). Every new or changed grade is audit logged.
        [HttpPost("{id:int}/scores")]
        public async Task<IActionResult> SubmitScores(int id, SubmitScoresDto dto)
        {
            var assessment = await db.Assessments.Include(a => a.Section).FirstOrDefaultAsync(a => a.Id == id);
            if (assessment is null) return NotFound(new { error = "Assessment not found." });
            var section = assessment.Section!;
            if (!User.CanManage(section)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "This is not your class." });
            if (section.Status == "completed") return BadRequest(new { error = "This class has ended. Grades are final." });

            if (dto.Scores.GroupBy(s => s.StudentId).Any(g => g.Count() > 1))
                return BadRequest(new { error = "Each student can only appear once." });
            var tooHigh = dto.Scores.Where(s => s.Score > assessment.PerfectScore).Select(s => s.StudentId).ToList();
            if (tooHigh.Count > 0)
                return BadRequest(new { error = $"A score cannot be higher than the perfect score ({assessment.PerfectScore}). Student ids: {string.Join(", ", tooHigh)}." });

            var ids = dto.Scores.Select(s => s.StudentId).ToList();
            var students = await db.Enrollments.Where(e => e.SectionId == section.Id && ids.Contains(e.StudentId))
                .Select(e => e.Student!).ToDictionaryAsync(s => s.Id);
            var notEnrolled = ids.Where(i => !students.ContainsKey(i)).ToList();
            if (notEnrolled.Count > 0)
                return BadRequest(new { error = $"These students are not enrolled in this class: {string.Join(", ", notEnrolled)}." });

            var existing = await db.Scores.Where(s => s.AssessmentId == id && ids.Contains(s.StudentId)).ToDictionaryAsync(s => s.StudentId);
            int added = 0, changed = 0;
            foreach (var entry in dto.Scores)
            {
                var name = $"{students[entry.StudentId].FirstName} {students[entry.StudentId].LastName}";
                if (existing.TryGetValue(entry.StudentId, out var score))
                {
                    if (score.Value == entry.Score) continue;
                    var reason = string.IsNullOrWhiteSpace(dto.Reason) ? "" : $" Reason: {dto.Reason.Trim()}";
                    await audit.Log("GRADE_CHANGED", User, $"Grade changed from {score.Value:0.##} to {entry.Score:0.##} for {name} on \"{assessment.Title}\".{reason}");
                    score.Value = entry.Score;
                    score.UpdatedAt = DateTime.UtcNow;
                    changed++;
                }
                else
                {
                    db.Scores.Add(new Score { AssessmentId = id, StudentId = entry.StudentId, Value = entry.Score });
                    await audit.Log("GRADE_ENTERED", User, $"Grade {entry.Score:0.##}/{assessment.PerfectScore} entered for {name} on \"{assessment.Title}\"");
                    added++;
                }
            }
            await db.SaveChangesAsync();
            return Ok(new { assessmentId = id, saved = added + changed, added, changed });
        }
    }
}

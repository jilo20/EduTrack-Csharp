// ============================================================================
// FILE:    Controllers/ReportsController.cs
// OWNER:   Bazar, Angelo
// WBS:     8.4 Class Report API, 8.5 Student Report API, 8.6 End Semester API
// PURPOSE: Reports and ending the semester.
//
// ENDPOINTS TO BUILD (Teacher / Admin):
//   GET  /api/classes/{id}/report                       -> ClassReportDto
//   GET  /api/classes/{id}/students/{studentId}/report  -> StudentReportDto
//   POST /api/classes/{id}/end-semester                 -> ClassReportDto (final)
// RULES for End Semester:
//   - Compute every student's final grade, set the class Status = "completed" and EndedAt = now.
//   - Notify each student (with their final grade) and every admin.
//   - Write an audit log.
// USES: Services/GradeService.cs
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
    [Route("/api/classes")]
    [Authorize]
    public class ReportsController(EduTrackContext db, GradeService grades, NotificationService notifications, AuditLogService audit) : ControllerBase
    {
        // 8.4 Class report
        [HttpGet("{id:int}/report")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> ClassReport(int id)
        {
            var section = await db.Sections.FindAsync(id);
            if (section is null) return NotFound(new { error = "Class not found." });
            if (!User.CanManage(section)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "This is not your class." });
            return Ok(await BuildClassReport(section));
        }

        // 8.5 Student report: the class's teacher, an admin, or the student themself.
        [HttpGet("{id:int}/students/{studentId:int}/report")]
        public async Task<IActionResult> StudentReport(int id, int studentId)
        {
            var section = await db.Sections.FindAsync(id);
            if (section is null) return NotFound(new { error = "Class not found." });
            if (!User.CanManage(section) && User.UserId() != studentId)
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "You cannot view this report." });

            var r = (await grades.ClassResults(section)).FirstOrDefault(x => x.Student.Id == studentId);
            if (r is null) return NotFound(new { error = "This student is not enrolled in this class." });

            var graded = r.Scores.Where(s => s.Score is not null).Select(s => (s.Assessment.Type, s.Score!.Value, s.Assessment.PerfectScore));
            var averages = GradeService.CategoryAverages(graded);
            var days = r.Attendance;
            return Ok(new StudentReportDto(
                new StudentRefDto(r.Student.Id, $"{r.Student.FirstName} {r.Student.LastName}"),
                section.Id, section.CourseProgram, r.Grade, r.GradePoint,
                r.GradePoint is double gp ? GradeService.Describe(gp) : null,
                r.Scores.Select(s => new StudentScoreDto(s.Assessment.Id, s.Assessment.Title, s.Assessment.Type, s.Score?.Value,
                    s.Assessment.PerfectScore, s.Score is null ? "PENDING" : "GRADED")).ToList(),
                section.Weights.Select(w => new CategoryResultDto(w.Key, averages.TryGetValue(w.Key, out var a) ? a : null, w.Value)).ToList(),
                new AttendanceSummaryDto(
                    days.Count(d => d.Status == Attendance.Present), days.Count(d => d.Status == Attendance.Late),
                    days.Count(d => d.Status == Attendance.Absent), days.Count(d => d.Status == Attendance.NoClass), r.AttendanceRate)));
        }

        // 8.6 End semester: final grades, class completed, students and admins notified, audit logged. Cannot be undone.
        [HttpPost("{id:int}/end-semester")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> EndSemester(int id)
        {
            var section = await db.Sections.FindAsync(id);
            if (section is null) return NotFound(new { error = "Class not found." });
            if (!User.CanManage(section)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "This is not your class." });
            if (section.Status == "completed") return BadRequest(new { error = "The semester for this class has already ended." });

            section.Status = "completed";
            section.EndedAt = DateTime.UtcNow;
            var report = await BuildClassReport(section);
            var label = $"{section.CourseProgram} ({section.CodeName})";

            foreach (var s in report.Students)
                notifications.Notify(s.Id, "Final grade posted",
                    s.EquivalentGrade is null
                        ? $"The semester for {label} has ended. No grade was recorded."
                        : $"The semester for {label} has ended. Your final grade is {s.EquivalentGrade:0.00} ({s.Grade:0.##}%).");
            var admins = await db.Users.Where(u => u.Role!.Name == "Admin" && u.Status == "active").Select(u => u.Id).ToListAsync();
            notifications.NotifyMany(admins, "Semester ended",
                $"The semester for {label} has ended. Class average: {report.ClassAverage?.ToString("0.##") ?? "-"}%, passing: {report.PassingCount}/{report.TotalStudents}.");
            await audit.Log("END_SEMESTER", User, $"Ended the semester for {label}");

            await db.SaveChangesAsync();
            return Ok(report);
        }

        private async Task<ClassReportDto> BuildClassReport(Section section)
        {
            var results = await grades.ClassResults(section);
            var withGrade = results.Where(r => r.Grade is not null).ToList();
            var average = withGrade.Count == 0 ? (double?)null : Math.Round(withGrade.Average(r => r.Grade!.Value), 2);
            var rates = results.Where(r => r.AttendanceRate is not null).Select(r => r.AttendanceRate!.Value).ToList();
            return new ClassReportDto(
                section.Id, section.CourseProgram, section.CodeName, section.Status, section.PassingGrade, results.Count,
                average, average is null ? null : GradeService.ToGradePoint(average.Value, section.PassingGrade),
                rates.Count == 0 ? null : Math.Round(rates.Average(), 2),
                withGrade.Count(r => r.Grade >= section.PassingGrade),
                results.OrderByDescending(r => r.Grade ?? -1)
                    .Select(r => new ClassReportStudentDto(r.Student.Id, $"{r.Student.FirstName} {r.Student.LastName}", r.Student.Email,
                        r.Grade, r.GradePoint, r.AttendanceRate)).ToList());
        }
    }
}

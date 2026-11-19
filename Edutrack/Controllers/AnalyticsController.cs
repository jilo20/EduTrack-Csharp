// ============================================================================
// FILE:    Controllers/AnalyticsController.cs
// OWNER:   Bazar, Angelo
// WBS:     11.1 Admin Stats & Analytics API, 11.2 Teacher Analytics API, 11.3 Student Analytics API
// PURPOSE: Numbers for the dashboards and charts.
//
// ENDPOINTS TO BUILD:
//   GET /api/analytics/admin         -> totals (students, teachers, classes) + system-wide performance and attendance
//   GET /api/analytics/teacher/{id}  -> performance and attendance of the teacher's classes
//   GET /api/analytics/student/{id}  -> the student's performance trend
// RULES: admin only for /admin; teachers and students can only request their own id.
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
    [Route("/api/analytics")]
    [Authorize]
    public class AnalyticsController(EduTrackContext db, GradeService grades) : ControllerBase
    {
        private static readonly string[] Buckets = ["Excellent", "Very Good", "Good", "Passing", "Failed"];

        // 11.1 Admin: totals, students per class, grade distribution, attendance split.
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Admin()
        {
            var active = db.Users.Where(u => u.Status == "active");
            var totals = new AdminTotalsDto(
                await active.CountAsync(u => u.Role!.Name == "Student"),
                await active.CountAsync(u => u.Role!.Name == "Teacher"),
                await db.Sections.CountAsync(s => s.Status == "active"),
                await active.CountAsync());

            var sections = await db.Sections.OrderBy(s => s.CodeName).ToListAsync();
            var enrollment = await db.Enrollments.GroupBy(e => e.SectionId).Select(g => new { g.Key, Count = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.Count);

            var points = new List<double>();
            foreach (var s in sections)
                points.AddRange((await grades.ClassResults(s)).Where(r => r.GradePoint is not null).Select(r => r.GradePoint!.Value));
            var performance = Buckets.Select(b => new PerformanceBucketDto(b, points.Count(p => GradeService.Describe(p) == b))).ToList();

            var statuses = await db.Attendances.Where(a => a.Status != Attendance.NoClass).Select(a => a.Status).ToListAsync();
            double Pct(string st) => statuses.Count == 0 ? 0 : Math.Round(100.0 * statuses.Count(x => x == st) / statuses.Count, 2);

            return Ok(new AdminAnalyticsDto(totals,
                sections.Select(s => new ClassEnrollmentDto(s.CodeName, enrollment.GetValueOrDefault(s.Id))).ToList(),
                performance,
                new AttendanceSplitDto(Pct(Attendance.Present), Pct(Attendance.Late), Pct(Attendance.Absent))));
        }

        // 11.2 Teacher: per class average, passing rate, attendance. The teacher themself or an admin.
        [HttpGet("teacher/{id:int}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Teacher(int id)
        {
            if (!User.IsSelfOrAdmin(id)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "You can only view your own analytics." });
            var sections = await db.Sections.Where(s => s.TeacherId == id).OrderBy(s => s.CodeName).ToListAsync();
            var ids = sections.Select(s => s.Id).ToList();

            var classes = new List<ClassStatsDto>();
            foreach (var s in sections)
            {
                var results = await grades.ClassResults(s);
                var graded = results.Where(r => r.Grade is not null).ToList();
                var rates = results.Where(r => r.AttendanceRate is not null).Select(r => r.AttendanceRate!.Value).ToList();
                classes.Add(new ClassStatsDto(s.Id, s.CodeName,
                    graded.Count == 0 ? null : Math.Round(graded.Average(r => r.Grade!.Value), 2),
                    graded.Count == 0 ? null : Math.Round(100.0 * graded.Count(r => r.Grade >= s.PassingGrade) / graded.Count, 2),
                    rates.Count == 0 ? null : Math.Round(rates.Average(), 2)));
            }
            var totals = new TeacherTotalsDto(sections.Count,
                await db.Enrollments.Where(e => ids.Contains(e.SectionId)).Select(e => e.StudentId).Distinct().CountAsync(),
                await db.Assessments.CountAsync(a => ids.Contains(a.SectionId)));
            return Ok(new TeacherAnalyticsDto(totals, classes));
        }

        // 11.3 Student: score trend over time and average per category. The student themself or an admin.
        [HttpGet("student/{id:int}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> Student(int id)
        {
            if (!User.IsSelfOrAdmin(id)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "You can only view your own analytics." });
            var scores = await db.Scores.Where(s => s.StudentId == id).Include(s => s.Assessment)
                .OrderBy(s => s.Assessment!.CreatedAt).ToListAsync();

            var trend = scores.Select(s => new TrendPointDto(s.Assessment!.Title, Math.Round(s.Value / s.Assessment.PerfectScore * 100, 2))).ToList();
            var byCategory = GradeService.CategoryAverages(scores.Select(s => (s.Assessment!.Type, s.Value, s.Assessment.PerfectScore)))
                .Select(c => new CategoryAverageDto(c.Key, c.Value)).ToList();
            return Ok(new StudentAnalyticsDto(trend, byCategory));
        }
    }
}

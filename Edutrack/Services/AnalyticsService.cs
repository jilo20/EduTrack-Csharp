// ============================================================================
// FILE:    Services/AnalyticsService.cs
// OWNER:   Bazar, Angelo
// WBS:     11.1 Admin Stats & Analytics, 11.2 Teacher Analytics, 11.3 Student Analytics
// PURPOSE: The numbers behind the dashboards and charts.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class AnalyticsService(
        IUserRepository users,
        IClassRepository classes,
        IAssessmentRepository assessments,
        IAttendanceRepository attendance,
        GradeService grades)
    {
        private static readonly string[] Buckets = ["Excellent", "Very Good", "Good", "Passing", "Failed"];

        // 11.1 Admin: totals, students per class, grade distribution, attendance split.
        public async Task<ServiceResult<AdminAnalyticsDto>> AdminAsync()
        {
            var totals = new AdminTotalsDto(
                await users.CountActiveAsync("Student"),
                await users.CountActiveAsync("Teacher"),
                await classes.CountActiveAsync(),
                await users.CountActiveAsync());

            var sections = await classes.ListAllAsync();
            var enrollment = await classes.GetEnrollmentCountsAsync();

            var points = new List<double>();
            foreach (var s in sections)
                points.AddRange((await grades.ClassResults(s)).Where(r => r.GradePoint is not null).Select(r => r.GradePoint!.Value));
            var performance = Buckets.Select(b => new PerformanceBucketDto(b, points.Count(p => GradeService.Describe(p) == b))).ToList();

            var statuses = await attendance.GetAllStatusesExceptAsync(Attendance.NoClass);
            double Pct(string st) => statuses.Count == 0 ? 0 : Math.Round(100.0 * statuses.Count(x => x == st) / statuses.Count, 2);

            return new AdminAnalyticsDto(totals,
                sections.Select(s => new ClassEnrollmentDto(s.CodeName, enrollment.GetValueOrDefault(s.Id))).ToList(),
                performance,
                new AttendanceSplitDto(Pct(Attendance.Present), Pct(Attendance.Late), Pct(Attendance.Absent)));
        }

        // 11.2 Teacher: per class average, passing rate, attendance. The teacher themself or an admin.
        public async Task<ServiceResult<TeacherAnalyticsDto>> TeacherAsync(int id, Caller caller)
        {
            if (!caller.IsSelfOrAdmin(id)) return Fail.Forbidden("You can only view your own analytics.");
            var sections = await classes.ListByTeacherAsync(id);
            var ids = sections.Select(s => s.Id).ToList();

            var perClass = new List<ClassStatsDto>();
            foreach (var s in sections)
            {
                var results = await grades.ClassResults(s);
                var graded = results.Where(r => r.Grade is not null).ToList();
                var rates = results.Where(r => r.AttendanceRate is not null).Select(r => r.AttendanceRate!.Value).ToList();
                perClass.Add(new ClassStatsDto(s.Id, s.CodeName,
                    graded.Count == 0 ? null : Math.Round(graded.Average(r => r.Grade!.Value), 2),
                    graded.Count == 0 ? null : Math.Round(100.0 * graded.Count(r => r.Grade >= s.PassingGrade) / graded.Count, 2),
                    rates.Count == 0 ? null : Math.Round(rates.Average(), 2)));
            }
            var totals = new TeacherTotalsDto(sections.Count,
                await classes.CountDistinctStudentsAsync(ids),
                await assessments.CountForSectionsAsync(ids));
            return new TeacherAnalyticsDto(totals, perClass);
        }

        // 11.3 Student: score trend over time and average per category. The student themself or an admin.
        public async Task<ServiceResult<StudentAnalyticsDto>> StudentAsync(int id, Caller caller)
        {
            if (!caller.IsSelfOrAdmin(id)) return Fail.Forbidden("You can only view your own analytics.");
            var scores = await assessments.GetStudentScoresAsync(id);

            var trend = scores.Select(s => new TrendPointDto(s.Assessment!.Title, Math.Round(s.Value / s.Assessment.PerfectScore * 100, 2))).ToList();
            var byCategory = GradeService.CategoryAverages(scores.Select(s => (s.Assessment!.Type, s.Value, s.Assessment.PerfectScore)))
                .Select(c => new CategoryAverageDto(c.Key, c.Value)).ToList();
            return new StudentAnalyticsDto(trend, byCategory);
        }
    }
}

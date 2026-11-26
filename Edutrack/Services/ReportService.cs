// ============================================================================
// FILE:    Services/ReportService.cs
// OWNER:   Bazar, Angelo
// WBS:     8.4 Class Report, 8.5 Student Report, 8.6 End Semester
// PURPOSE: Builds reports from GradeService results, and ends a class's semester
//          (final grades, class completed, students and admins notified, audit log).
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class ReportService(
        IClassRepository classes,
        IUserRepository users,
        IUnitOfWork uow,
        GradeService grades,
        NotificationService notifications,
        AuditLogService audit)
    {
        // 8.4 Class report
        public async Task<ServiceResult<ClassReportDto>> ClassReportAsync(int id, Caller caller)
        {
            var section = await classes.GetByIdAsync(id);
            if (section is null) return Fail.NotFound("Class not found.");
            if (!caller.CanManage(section)) return Fail.Forbidden("This is not your class.");
            return await BuildClassReport(section);
        }

        // 8.5 Student report: the class's teacher, an admin, or the student themself.
        public async Task<ServiceResult<StudentReportDto>> StudentReportAsync(int id, int studentId, Caller caller)
        {
            var section = await classes.GetByIdAsync(id);
            if (section is null) return Fail.NotFound("Class not found.");
            if (!caller.CanManage(section) && caller.Id != studentId)
                return Fail.Forbidden("You cannot view this report.");

            var r = (await grades.ClassResults(section)).FirstOrDefault(x => x.Student.Id == studentId);
            if (r is null) return Fail.NotFound("This student is not enrolled in this class.");

            var graded = r.Scores.Where(s => s.Score is not null).Select(s => (s.Assessment.Type, s.Score!.Value, s.Assessment.PerfectScore));
            var averages = GradeService.CategoryAverages(graded);
            var days = r.Attendance;
            return new StudentReportDto(
                new StudentRefDto(r.Student.Id, $"{r.Student.FirstName} {r.Student.LastName}"),
                section.Id, section.CourseProgram, r.Grade, r.GradePoint,
                r.GradePoint is double gp ? GradeService.Describe(gp) : null,
                r.Scores.Select(s => new StudentScoreDto(s.Assessment.Id, s.Assessment.Title, s.Assessment.Type, s.Score?.Value,
                    s.Assessment.PerfectScore, s.Score is null ? "PENDING" : "GRADED")).ToList(),
                section.Weights.Select(w => new CategoryResultDto(w.Key, averages.TryGetValue(w.Key, out var a) ? a : null, w.Value)).ToList(),
                new AttendanceSummaryDto(
                    days.Count(d => d.Status == Attendance.Present), days.Count(d => d.Status == Attendance.Late),
                    days.Count(d => d.Status == Attendance.Absent), days.Count(d => d.Status == Attendance.NoClass), r.AttendanceRate));
        }

        // 8.6 End semester. Cannot be undone.
        public async Task<ServiceResult<ClassReportDto>> EndSemesterAsync(int id, Caller caller)
        {
            var section = await classes.GetByIdAsync(id);
            if (section is null) return Fail.NotFound("Class not found.");
            if (!caller.CanManage(section)) return Fail.Forbidden("This is not your class.");
            if (section.Status == "completed") return Fail.BadRequest("The semester for this class has already ended.");

            section.Status = "completed";
            section.EndedAt = DateTime.UtcNow;
            var report = await BuildClassReport(section);
            var label = $"{section.CourseProgram} ({section.CodeName})";

            foreach (var s in report.Students)
                notifications.Notify(s.Id, "Final grade posted",
                    s.EquivalentGrade is null
                        ? $"The semester for {label} has ended. No grade was recorded."
                        : $"The semester for {label} has ended. Your final grade is {s.EquivalentGrade:0.00} ({s.Grade:0.##}%).");
            var admins = await users.GetActiveUserIdsAsync("Admin");
            notifications.NotifyMany(admins, "Semester ended",
                $"The semester for {label} has ended. Class average: {report.ClassAverage?.ToString("0.##") ?? "-"}%, passing: {report.PassingCount}/{report.TotalStudents}.");
            await audit.Log("END_SEMESTER", caller, $"Ended the semester for {label}");

            await uow.SaveChangesAsync();
            return report;
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

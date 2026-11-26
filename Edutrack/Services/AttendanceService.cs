// ============================================================================
// FILE:    Services/AttendanceService.cs
// OWNER:   Bazar, Angelo
// WBS:     9.1 Mark Attendance, 9.2 Attendance Records
// PURPOSE: Attendance rules: class ownership, no future dates, valid statuses, enrolled students only,
//          one record per student/class/date (saving again updates it).
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class AttendanceService(
        IClassRepository classes,
        IAttendanceRepository attendance,
        IUserRepository users,
        IUnitOfWork uow,
        AuditLogService audit)
    {
        // 9.1 Mark attendance.
        public async Task<ServiceResult<SavedCountDto>> MarkAsync(MarkAttendanceDto dto, Caller caller)
        {
            var section = await classes.GetByIdAsync(dto.SectionId);
            if (section is null) return Fail.NotFound("Class not found.");
            if (!caller.CanManage(section)) return Fail.Forbidden("This is not your class.");
            if (section.Status == "completed") return Fail.BadRequest("This class has ended.");
            if (dto.Date > DateOnly.FromDateTime(DateTime.Now)) return Fail.BadRequest("Attendance cannot be marked for a future date.");
            if (dto.Records.GroupBy(r => r.StudentId).Any(g => g.Count() > 1))
                return Fail.BadRequest("Each student can only appear once.");

            var statuses = new Dictionary<int, string>();
            foreach (var r in dto.Records)
            {
                var status = Attendance.Statuses.FirstOrDefault(s => string.Equals(s, r.Status.Trim(), StringComparison.OrdinalIgnoreCase));
                if (status is null) return Fail.BadRequest($"Status must be one of: {string.Join(", ", Attendance.Statuses)}.");
                statuses[r.StudentId] = status;
            }

            var ids = statuses.Keys.ToList();
            var enrolled = await classes.GetEnrolledStudentIdsAsync(section.Id, ids);
            var notEnrolled = ids.Except(enrolled).ToList();
            if (notEnrolled.Count > 0)
                return Fail.BadRequest($"These students are not enrolled in this class: {string.Join(", ", notEnrolled)}.");

            var existing = await attendance.GetForDateAsync(section.Id, dto.Date, ids);
            foreach (var r in dto.Records)
            {
                var remarks = string.IsNullOrWhiteSpace(r.Remarks) ? null : r.Remarks.Trim();
                if (existing.TryGetValue(r.StudentId, out var row)) { row.Status = statuses[r.StudentId]; row.Remarks = remarks; }
                else attendance.Add(new Attendance { SectionId = section.Id, StudentId = r.StudentId, Date = dto.Date, Status = statuses[r.StudentId], Remarks = remarks });
            }
            await audit.Log("ATTENDANCE_MARKED", caller, $"Attendance marked for {dto.Records.Count} students in {section.CodeName} on {dto.Date:yyyy-MM-dd}");
            await uow.SaveChangesAsync();
            return new SavedCountDto(dto.Records.Count);
        }

        // 9.2 One class on one date: every enrolled student, with Status null if not marked yet.
        public async Task<ServiceResult<List<AttendanceRecordDto>>> ForClassAsync(int classId, DateOnly date, Caller caller)
        {
            var section = await classes.GetByIdAsync(classId);
            if (section is null) return Fail.NotFound("Class not found.");
            if (!caller.CanManage(section)) return Fail.Forbidden("This is not your class.");

            var students = await classes.GetStudentsAsync(classId);
            var rows = await attendance.GetForDateAsync(classId, date);
            return students.Select(s => new AttendanceRecordDto(s.Id, $"{s.FirstName} {s.LastName}", classId, date,
                rows.GetValueOrDefault(s.Id)?.Status, rows.GetValueOrDefault(s.Id)?.Remarks)).ToList();
        }

        // 9.2 A student's attendance in all their classes: the student themself or an admin.
        public async Task<ServiceResult<StudentAttendanceDto>> ForStudentAsync(int id, Caller caller)
        {
            if (!caller.IsSelfOrAdmin(id)) return Fail.Forbidden("You can only view your own attendance.");
            if (!await users.ExistsAsync(id)) return Fail.NotFound("Student not found.");

            var sections = await classes.ListForStudentAsync(id);
            var records = await attendance.ListByStudentAsync(id);
            var perClass = sections.Select(s =>
            {
                var days = records.Where(r => r.SectionId == s.Id).ToList();
                return new ClassAttendanceDto(s.Id, s.CourseProgram, GradeService.AttendanceRate(days.Select(d => d.Status)),
                    days.Select(d => new AttendanceDayDto(d.Date, d.Status, d.Remarks)).ToList());
            }).ToList();
            return new StudentAttendanceDto(id, GradeService.AttendanceRate(records.Select(r => r.Status)), perClass);
        }
    }
}

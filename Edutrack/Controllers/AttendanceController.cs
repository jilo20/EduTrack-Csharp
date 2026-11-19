// ============================================================================
// FILE:    Controllers/AttendanceController.cs
// OWNER:   Bazar, Angelo
// WBS:     9.1 Mark Attendance API, 9.2 Attendance Records API
// PURPOSE: Attendance.
//
// ENDPOINTS TO BUILD:
//   POST /api/attendance                   body: MarkAttendanceDto   (Teacher / Admin)
//   GET  /api/attendance?classId=&date=    -> AttendanceRecordDto[]  (Teacher / Admin)
//   GET  /api/students/{id}/attendance     -> AttendanceRecordDto[] + rate (the student or an admin)
// RULES:
//   - Status is Present, Late, Absent, or No Class.
//   - One record per student, class, and date (update it if it already exists).
//   - Write an audit log when attendance is marked.
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
    [Authorize]
    public class AttendanceController(EduTrackContext db, AuditLogService audit) : ControllerBase
    {
        // 9.1 Mark attendance. One record per student, class, and date (an existing one is updated).
        [HttpPost("/api/attendance")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Mark(MarkAttendanceDto dto)
        {
            var section = await db.Sections.FindAsync(dto.SectionId);
            if (section is null) return NotFound(new { error = "Class not found." });
            if (!User.CanManage(section)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "This is not your class." });
            if (section.Status == "completed") return BadRequest(new { error = "This class has ended." });
            if (dto.Date > DateOnly.FromDateTime(DateTime.Now)) return BadRequest(new { error = "Attendance cannot be marked for a future date." });
            if (dto.Records.GroupBy(r => r.StudentId).Any(g => g.Count() > 1))
                return BadRequest(new { error = "Each student can only appear once." });

            var statuses = new Dictionary<int, string>();
            foreach (var r in dto.Records)
            {
                var status = Attendance.Statuses.FirstOrDefault(s => string.Equals(s, r.Status.Trim(), StringComparison.OrdinalIgnoreCase));
                if (status is null) return BadRequest(new { error = $"Status must be one of: {string.Join(", ", Attendance.Statuses)}." });
                statuses[r.StudentId] = status;
            }

            var ids = statuses.Keys.ToList();
            var enrolled = await db.Enrollments.Where(e => e.SectionId == section.Id && ids.Contains(e.StudentId)).Select(e => e.StudentId).ToListAsync();
            var notEnrolled = ids.Except(enrolled).ToList();
            if (notEnrolled.Count > 0)
                return BadRequest(new { error = $"These students are not enrolled in this class: {string.Join(", ", notEnrolled)}." });

            var existing = await db.Attendances.Where(a => a.SectionId == section.Id && a.Date == dto.Date && ids.Contains(a.StudentId))
                .ToDictionaryAsync(a => a.StudentId);
            foreach (var r in dto.Records)
            {
                var remarks = string.IsNullOrWhiteSpace(r.Remarks) ? null : r.Remarks.Trim();
                if (existing.TryGetValue(r.StudentId, out var row)) { row.Status = statuses[r.StudentId]; row.Remarks = remarks; }
                else db.Attendances.Add(new Attendance { SectionId = section.Id, StudentId = r.StudentId, Date = dto.Date, Status = statuses[r.StudentId], Remarks = remarks });
            }
            await audit.Log("ATTENDANCE_MARKED", User, $"Attendance marked for {dto.Records.Count} students in {section.CodeName} on {dto.Date:yyyy-MM-dd}");
            await db.SaveChangesAsync();
            return Ok(new { saved = dto.Records.Count });
        }

        // 9.2 One class on one date: every enrolled student, with Status null if not marked yet.
        [HttpGet("/api/attendance")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> ForClass([FromQuery] int classId, [FromQuery] DateOnly date)
        {
            var section = await db.Sections.FindAsync(classId);
            if (section is null) return NotFound(new { error = "Class not found." });
            if (!User.CanManage(section)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "This is not your class." });

            var students = await db.Enrollments.Where(e => e.SectionId == classId).Select(e => e.Student!)
                .OrderBy(s => s.LastName).ThenBy(s => s.FirstName).ToListAsync();
            var rows = await db.Attendances.Where(a => a.SectionId == classId && a.Date == date).ToDictionaryAsync(a => a.StudentId);
            return Ok(students.Select(s => new AttendanceRecordDto(s.Id, $"{s.FirstName} {s.LastName}", classId, date,
                rows.GetValueOrDefault(s.Id)?.Status, rows.GetValueOrDefault(s.Id)?.Remarks)));
        }

        // 9.2 A student's attendance in all their classes: the student themself or an admin.
        [HttpGet("/api/students/{id:int}/attendance")]
        public async Task<IActionResult> ForStudent(int id)
        {
            if (!User.IsSelfOrAdmin(id)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "You can only view your own attendance." });
            if (!await db.Users.AnyAsync(u => u.Id == id)) return NotFound(new { error = "Student not found." });

            var sections = await db.Enrollments.Where(e => e.StudentId == id).Select(e => e.Section!).OrderBy(s => s.CourseProgram).ToListAsync();
            var records = await db.Attendances.Where(a => a.StudentId == id).OrderBy(a => a.Date).ToListAsync();
            var classes = sections.Select(s =>
            {
                var days = records.Where(r => r.SectionId == s.Id).ToList();
                return new ClassAttendanceDto(s.Id, s.CourseProgram, GradeService.AttendanceRate(days.Select(d => d.Status)),
                    days.Select(d => new AttendanceDayDto(d.Date, d.Status, d.Remarks)).ToList());
            }).ToList();
            return Ok(new StudentAttendanceDto(id, GradeService.AttendanceRate(records.Select(r => r.Status)), classes));
        }
    }
}

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
//
// ARCHITECTURE: Controller -> Service -> Repository. This controller only calls the service;
//               the rules are in Services/, the database work in Repositories/.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edutrack.Controllers
{
    [Authorize]
    public class AttendanceController(AttendanceService attendance) : ApiControllerBase
    {
        // 9.1 Mark attendance
        [HttpPost("/api/attendance")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Mark(MarkAttendanceDto dto) => Respond(await attendance.MarkAsync(dto, Caller));

        // 9.2 One class on one date
        [HttpGet("/api/attendance")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> ForClass([FromQuery] int classId, [FromQuery] DateOnly date) =>
            Respond(await attendance.ForClassAsync(classId, date, Caller));

        // 9.2 A student's attendance in all their classes
        [HttpGet("/api/students/{id:int}/attendance")]
        public async Task<IActionResult> ForStudent(int id) => Respond(await attendance.ForStudentAsync(id, Caller));
    }
}

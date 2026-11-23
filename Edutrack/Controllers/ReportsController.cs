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
    [Route("/api/classes")]
    [Authorize]
    public class ReportsController(ReportService reports) : ApiControllerBase
    {
        // 8.4 Class report
        [HttpGet("{id:int}/report")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> ClassReport(int id) => Respond(await reports.ClassReportAsync(id, Caller));

        // 8.5 Student report
        [HttpGet("{id:int}/students/{studentId:int}/report")]
        public async Task<IActionResult> StudentReport(int id, int studentId) => Respond(await reports.StudentReportAsync(id, studentId, Caller));

        // 8.6 End semester
        [HttpPost("{id:int}/end-semester")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> EndSemester(int id) => Respond(await reports.EndSemesterAsync(id, Caller));
    }
}

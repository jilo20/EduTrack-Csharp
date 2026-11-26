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
//
// ARCHITECTURE: Controller -> Service -> Repository. This controller only calls the service;
//               the rules are in Services/, the database work in Repositories/.
// ============================================================================

using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edutrack.Controllers
{
    [Route("/api/analytics")]
    [Authorize]
    public class AnalyticsController(AnalyticsService analytics) : ApiControllerBase
    {
        // 11.1
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Admin() => Respond(await analytics.AdminAsync());

        // 11.2
        [HttpGet("teacher/{id:int}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Teacher(int id) => Respond(await analytics.TeacherAsync(id, Caller));

        // 11.3
        [HttpGet("student/{id:int}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> Student(int id) => Respond(await analytics.StudentAsync(id, Caller));
    }
}

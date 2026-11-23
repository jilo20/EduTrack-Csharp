// OWNER: Lopez, Mary Vincent — WBS 10.1 Dashboard, 10.2 Performance, 10.3 Assessments
// ARCHITECTURE: Controller -> Service -> Repository. This controller only calls the service;
//               the rules are in Services/, the database work in Repositories/.

using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edutrack.Controllers
{
    [Authorize(Roles = "Student,Admin")]
    [Route("/api/students/{id:int}")]
    public class StudentsController(StudentService students) : ApiControllerBase
    {
        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard(int id) => Respond(await students.DashboardAsync(id, Caller));

        [HttpGet("performance")]
        public async Task<IActionResult> Performance(int id) => Respond(await students.PerformanceAsync(id, Caller));

        [HttpGet("assessments")]
        public async Task<IActionResult> Assessments(int id) => Respond(await students.AssessmentsAsync(id, Caller));
    }
}

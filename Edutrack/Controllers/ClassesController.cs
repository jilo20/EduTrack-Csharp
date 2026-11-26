// ============================================================================
// FILE:    Controllers/ClassesController.cs
// OWNER:   Bazar, Angelo
// WBS:     7.1 Create Class API, 7.2 My Classes / All Classes API, 7.3 Enrollment & Roster API
// PURPOSE: Classes (sections), enrollment, and roster.
//
// ENDPOINTS TO BUILD (Teacher / Admin):
//   GET  /api/classes?teacherId=   -> ClassDto[]  (teacher: own classes; admin: all classes)
//   POST /api/classes              body: CreateClassDto -> ClassDto
//   PUT  /api/classes/{id}         body: UpdateClassDto -> ClassDto
//   GET  /api/classes/{id}/roster  -> RosterDto (students + their scores)
//   POST /api/classes/{id}/enroll  body: EnrollStudentsDto
// RULES:
//   - A teacher can only create and open their own classes. An admin can do it for any teacher.
//   - A student cannot be enrolled twice in the same class.
//   - Notify the teacher when a student is enrolled (NotificationService).
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
    [Authorize(Roles = "Admin,Teacher")]
    public class ClassesController(ClassService classes) : ApiControllerBase
    {
        // 7.2 My Classes (teacher) / All Classes (admin, optionally ?teacherId=)
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? teacherId) => Respond(await classes.ListAsync(teacherId, Caller));

        // 7.1 Create Class
        [HttpPost]
        public async Task<IActionResult> Create(CreateClassDto dto) => Respond(await classes.CreateAsync(dto, Caller));

        // 7.1 Update Class
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateClassDto dto) => Respond(await classes.UpdateAsync(id, dto, Caller));

        // 7.3 Roster
        [HttpGet("{id:int}/roster")]
        public async Task<IActionResult> Roster(int id) => Respond(await classes.RosterAsync(id, Caller));

        // 7.3 Enrollment
        [HttpPost("{id:int}/enroll")]
        public async Task<IActionResult> Enroll(int id, EnrollStudentsDto dto) => Respond(await classes.EnrollAsync(id, dto, Caller));
    }
}

// ============================================================================
// FILE:    Controllers/UsersController.cs
// OWNER:   Bazar, Angelo
// WBS:     6.1 Users API: Add / Edit, 6.2 Deactivate, 6.3 Lists
// PURPOSE: Admin manages user accounts.
//
// ENDPOINTS TO BUILD (Admin only, except: a Teacher may GET ?role=Student to pick students to enroll):
//   GET    /api/users?role=Student|Teacher  -> UserDto[]   (also used as the student pool for enrollment)
//   POST   /api/users        body: CreateUserDto -> UserDto
//   PUT    /api/users/{id}   body: UpdateUserDto -> UserDto
//   DELETE /api/users/{id}   -> sets Status = "inactive" (do NOT delete the row)
// RULES: email must be unique. Write an audit log for create, update, and deactivate.
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
    [Route("/api/users")]
    public class UsersController(UserService users) : ApiControllerBase
    {
        [HttpGet]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetAll([FromQuery] string? role) => Respond(await users.ListAsync(role, Caller));

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(CreateUserDto dto) => Respond(await users.CreateAsync(dto, Caller));

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, UpdateUserDto dto) => Respond(await users.UpdateAsync(id, dto, Caller));

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Deactivate(int id) => Respond(await users.DeactivateAsync(id, Caller));
    }
}

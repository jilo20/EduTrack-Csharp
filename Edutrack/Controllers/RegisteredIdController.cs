// OWNER: Lopez, Mary Vincent — WBS 5.1
// ARCHITECTURE: Controller -> Service -> Repository. This controller only calls the service;
//               the rules are in Services/, the database work in Repositories/.

using System.ComponentModel.DataAnnotations;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edutrack.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("/api/registeredid")]
    public class RegisteredIdController(InviteService invites) : ApiControllerBase
    {
        public record GenerateInviteDto([Range(2, 3)] int RoleId);

        [HttpGet]
        public async Task<IActionResult> GetAll() => Respond(await invites.ListAsync());

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetId(int id) => Respond(await invites.GetAsync(id));

        [HttpPost]
        public async Task<IActionResult> Create(GenerateInviteDto dto) => Respond(await invites.CreateAsync(dto.RoleId, Caller));
    }
}

// OWNER: Lopez, Mary Vincent — WBS 7.4
// ARCHITECTURE: Controller -> Service -> Repository. This controller only calls the service;
//               the rules are in Services/, the database work in Repositories/.

using Edutrack.Dtos;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edutrack.Controllers
{
    [Authorize(Roles = "Teacher,Admin")]
    [Route("/api/classes/{id:int}/weights")]
    public class ClassWeightsController(ClassService classes) : ApiControllerBase
    {
        // Body: the flat category map sent by src/api/classes.js, e.g. { "Quiz": 30, "Project": 70 }.
        [HttpPut]
        public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, int> weights)
        {
            if (!TryValidateModel(new UpdateWeightsDto(weights))) return ValidationProblem(ModelState);
            return Respond(await classes.UpdateWeightsAsync(id, weights, Caller));
        }
    }
}

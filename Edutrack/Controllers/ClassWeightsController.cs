using Edutrack.Data;
using Edutrack.Dtos;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Controllers;

// OWNER: Lopez, Mary Vincent — WBS 7.4
[ApiController]
[Authorize(Roles = "Teacher,Admin")]
[Route("/api/classes/{id:int}/weights")]
public class ClassWeightsController(EduTrackContext db) : ControllerBase
{
    [HttpPut]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, int> weights)
    {
        // Preserve the flat category map sent by src/api/classes.js.
        if (!TryValidateModel(new UpdateWeightsDto(weights))) return ValidationProblem(ModelState);
        var section = await db.Sections.FirstOrDefaultAsync(s => s.Id == id);
        if (section is null) return NotFound(new { error = "Class not found." });
        if (!User.IsInRole("Admin") && section.TeacherId != User.UserId()) return Forbid();
        section.Weights = new Dictionary<string, int>(weights);
        await db.SaveChangesAsync();
        return Ok(new { classId = id, weights = section.Weights });
    }
}

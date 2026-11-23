// ============================================================================
// FILE:    Controllers/AssessmentsController.cs
// OWNER:   Bazar, Angelo
// WBS:     8.1 Assessments API, 8.2 Scores API
// PURPOSE: Assessments and scores.
//
// ENDPOINTS TO BUILD (Teacher / Admin):
//   POST /api/assessments              body: CreateAssessmentDto -> AssessmentDto
//   POST /api/assessments/{id}/scores  body: SubmitScoresDto
// RULES:
//   - A score cannot be higher than the assessment's perfect score.
//   - One score per student per assessment (update it if it already exists).
//   - Write an audit log for every new grade and every grade change (old -> new).
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
    [Route("/api/assessments")]
    [Authorize(Roles = "Admin,Teacher")]
    public class AssessmentsController(AssessmentService assessments) : ApiControllerBase
    {
        // 8.1 Create an assessment
        [HttpPost]
        public async Task<IActionResult> Create(CreateAssessmentDto dto) => Respond(await assessments.CreateAsync(dto, Caller));

        // 8.2 Save scores
        [HttpPost("{id:int}/scores")]
        public async Task<IActionResult> SubmitScores(int id, SubmitScoresDto dto) => Respond(await assessments.SubmitScoresAsync(id, dto, Caller));
    }
}

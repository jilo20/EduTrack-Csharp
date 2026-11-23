// ============================================================================
// FILE:    Controllers/AuditLogsController.cs
// OWNER:   Bazar, Angelo
// WBS:     13.2 Audit Logs API
// PURPOSE: Admin reads the audit trail.
//
// ENDPOINT TO BUILD (Admin only):
//   GET /api/auditlogs  -> AuditLogDto[] (newest first)
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
    [Route("/api/auditlogs")]
    [Authorize(Roles = "Admin")]
    public class AuditLogsController(AuditLogService audit) : ApiControllerBase
    {
        // 13.2: newest first
        [HttpGet]
        public async Task<IActionResult> GetAll() => Respond(await audit.ListAsync());
    }
}

// ============================================================================
// FILE:    Controllers/AuditLogsController.cs
// OWNER:   Bazar, Angelo
// WBS:     13.2 Audit Logs API
// PURPOSE: Admin reads the audit trail.
//
// ENDPOINT TO BUILD (Admin only):
//   GET /api/auditlogs  -> AuditLogDto[] (newest first)
//
// ============================================================================

using Edutrack.Data;
using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Controllers
{
    [ApiController]
    [Route("/api/auditlogs")]
    [Authorize(Roles = "Admin")]
    public class AuditLogsController(EduTrackContext db) : ControllerBase
    {
        // 13.2: newest first. Capped at the latest 1000 rows; the page filters and pages them.
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var logs = await db.AuditLogs.OrderByDescending(a => a.Timestamp).ThenByDescending(a => a.Id).Take(1000)
                .Select(a => new AuditLogDto(a.Id, a.Timestamp, a.Action, a.ActorName, a.ActorRole, a.Details))
                .ToListAsync();
            return Ok(logs);
        }
    }
}

// ============================================================================
// FILE:    Services/AuditLogService.cs
// OWNER:   Bazar, Angelo
// WBS:     13.1 Audit Logging, 13.2 Audit Logs API
// PURPOSE: One place to record important actions, and the admin's audit trail.
//          The log row is saved together with the change it describes (by the caller's UnitOfWork save).
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class AuditLogService(IAuditLogRepository logs, IUserRepository users)
    {
        // The logged-in user is the actor.
        public async Task Log(string action, Caller actor, string details) =>
            Log(action, await users.GetByIdAsync(actor.Id), details);

        // For actions with no logged-in caller (e.g. Forgot Password): the account itself is the actor.
        public void Log(string action, User? user, string details)
        {
            logs.Add(new AuditLog
            {
                Action = action,
                ActorId = user?.Id,
                ActorName = user is null ? "Unknown" : $"{user.FirstName} {user.LastName}",
                ActorRole = user?.Role?.Name,
                Details = details.Length > 500 ? details[..500] : details,
            });
        }

        // 13.2: newest first. Capped at the latest 1000 rows; the page filters and pages them.
        public async Task<ServiceResult<List<AuditLogDto>>> ListAsync() =>
            (await logs.ListLatestAsync(1000))
                .Select(a => new AuditLogDto(a.Id, a.Timestamp, a.Action, a.ActorName, a.ActorRole, a.Details)).ToList();
    }
}

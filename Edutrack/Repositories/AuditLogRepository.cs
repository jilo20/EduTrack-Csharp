// ============================================================================
// FILE:    Repositories/AuditLogRepository.cs
// PURPOSE: Database access for AuditLogs. Queries only; no business rules.
// ============================================================================

using Edutrack.Data;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Repositories
{
    public interface IAuditLogRepository
    {
        Task<List<AuditLog>> ListLatestAsync(int take);
        void Add(AuditLog log);
    }

    public class AuditLogRepository(EduTrackContext db) : IAuditLogRepository
    {
        public Task<List<AuditLog>> ListLatestAsync(int take) =>
            db.AuditLogs.OrderByDescending(a => a.Timestamp).ThenByDescending(a => a.Id).Take(take).ToListAsync();

        public void Add(AuditLog log) => db.AuditLogs.Add(log);
    }
}

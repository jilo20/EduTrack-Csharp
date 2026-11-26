// ============================================================================
// FILE:    Repositories/UnitOfWork.cs
// PURPOSE: Commits everything the repositories added or changed in one database save.
//          All repositories share the same DbContext per request, so a service can stage
//          changes in several repositories (e.g. a user + the used invite + an audit log)
//          and save them together.
// ============================================================================

using Edutrack.Data;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace Edutrack.Repositories
{
    public interface IUnitOfWork
    {
        Task<int> SaveChangesAsync();

        // Saves, but returns false (and discards the pending changes) when a unique index
        // rejects the save, so the caller can retry with a new value.
        Task<bool> TrySaveUniqueAsync();
    }

    public class UnitOfWork(EduTrackContext db) : IUnitOfWork
    {
        public Task<int> SaveChangesAsync() => db.SaveChangesAsync();

        public async Task<bool> TrySaveUniqueAsync()
        {
            try
            {
                await db.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateException ex) when (ex.InnerException is MySqlException { Number: 1062 })
            {
                db.ChangeTracker.Clear();
                return false;
            }
        }
    }
}

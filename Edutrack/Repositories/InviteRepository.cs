// ============================================================================
// FILE:    Repositories/InviteRepository.cs
// PURPOSE: Database access for invite IDs (RegisteredIds). Queries only; no business rules.
// ============================================================================

using Edutrack.Data;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Repositories
{
    public interface IInviteRepository
    {
        Task<List<RegisteredId>> ListAsync();
        Task<RegisteredId?> GetByIdAsync(int id);
        Task<RegisteredId?> GetUnusedAsync(string idNumber);
        Task<bool> NumberExistsAsync(string idNumber);
        void Add(RegisteredId invite);
    }

    public class InviteRepository(EduTrackContext db) : IInviteRepository
    {
        public Task<List<RegisteredId>> ListAsync() =>
            db.RegisteredIds.Include(r => r.Role).OrderByDescending(r => r.CreatedAt).ToListAsync();

        public Task<RegisteredId?> GetByIdAsync(int id) =>
            db.RegisteredIds.Include(r => r.Role).FirstOrDefaultAsync(r => r.Id == id);

        public Task<RegisteredId?> GetUnusedAsync(string idNumber) =>
            db.RegisteredIds.Include(r => r.Role).FirstOrDefaultAsync(r => r.IdNumber == idNumber && !r.IsUsed);

        public Task<bool> NumberExistsAsync(string idNumber) => db.RegisteredIds.AnyAsync(r => r.IdNumber == idNumber);

        public void Add(RegisteredId invite) => db.RegisteredIds.Add(invite);
    }
}

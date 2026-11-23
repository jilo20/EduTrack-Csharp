// ============================================================================
// FILE:    Repositories/UserRepository.cs
// PURPOSE: Database access for Users and Roles. Queries only; no business rules.
// ============================================================================

using Edutrack.Data;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(int id);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdNumberAsync(string idNumber);
        Task<bool> ExistsAsync(int id);
        Task<bool> IsStudentAsync(int id);
        Task<bool> EmailExistsAsync(string email, int? exceptUserId = null);
        Task<bool> IdNumberExistsAsync(string idNumber);
        Task<List<User>> ListAsync(string? roleName, bool activeOnly);
        Task<List<User>> GetActiveStudentsAsync(IReadOnlyCollection<int> ids);
        Task<List<int>> GetActiveUserIdsAsync(string? roleName = null, int? exceptUserId = null);
        Task<int> CountActiveAsync(string? roleName = null);
        Task<Role?> GetRoleAsync(int roleId);
        void Add(User user);
    }

    public class UserRepository(EduTrackContext db) : IUserRepository
    {
        public Task<User?> GetByIdAsync(int id) =>
            db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);

        public Task<User?> GetByEmailAsync(string email) =>
            db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == email);

        public Task<User?> GetByIdNumberAsync(string idNumber) =>
            db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.IdNumber == idNumber);

        public Task<bool> ExistsAsync(int id) => db.Users.AnyAsync(u => u.Id == id);

        public Task<bool> IsStudentAsync(int id) => db.Users.AnyAsync(u => u.Id == id && u.Role!.Name == "Student");

        public Task<bool> EmailExistsAsync(string email, int? exceptUserId = null) =>
            db.Users.AnyAsync(u => u.Email == email && (exceptUserId == null || u.Id != exceptUserId));

        public Task<bool> IdNumberExistsAsync(string idNumber) => db.Users.AnyAsync(u => u.IdNumber == idNumber);

        public Task<List<User>> ListAsync(string? roleName, bool activeOnly)
        {
            var query = db.Users.Include(u => u.Role).AsQueryable();
            if (roleName is not null) query = query.Where(u => u.Role!.Name == roleName);
            if (activeOnly) query = query.Where(u => u.Status == "active");
            return query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ToListAsync();
        }

        public Task<List<User>> GetActiveStudentsAsync(IReadOnlyCollection<int> ids) =>
            db.Users.Where(u => ids.Contains(u.Id) && u.Role!.Name == "Student" && u.Status == "active").ToListAsync();

        public Task<List<int>> GetActiveUserIdsAsync(string? roleName = null, int? exceptUserId = null)
        {
            var query = db.Users.Where(u => u.Status == "active");
            if (exceptUserId is not null) query = query.Where(u => u.Id != exceptUserId);
            if (roleName is not null) query = query.Where(u => u.Role!.Name == roleName);
            return query.Select(u => u.Id).ToListAsync();
        }

        public Task<int> CountActiveAsync(string? roleName = null) =>
            roleName is null
                ? db.Users.CountAsync(u => u.Status == "active")
                : db.Users.CountAsync(u => u.Status == "active" && u.Role!.Name == roleName);

        public async Task<Role?> GetRoleAsync(int roleId) => await db.Roles.FindAsync(roleId);

        public void Add(User user) => db.Users.Add(user);
    }
}

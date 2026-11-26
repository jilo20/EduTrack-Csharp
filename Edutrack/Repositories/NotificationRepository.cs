// ============================================================================
// FILE:    Repositories/NotificationRepository.cs
// PURPOSE: Database access for Notifications. Queries only; no business rules.
// ============================================================================

using Edutrack.Data;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Repositories
{
    public interface INotificationRepository
    {
        Task<List<Notification>> ListForUserAsync(int userId, int take);
        Task<Notification?> GetForUserAsync(int id, int userId);
        Task<int> MarkAllReadAsync(int userId);
        Task<int> DeleteAllAsync(int userId);
        void Add(Notification notification);
    }

    public class NotificationRepository(EduTrackContext db) : INotificationRepository
    {
        public Task<List<Notification>> ListForUserAsync(int userId, int take) =>
            db.Notifications.Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt).ThenByDescending(n => n.Id).Take(take).ToListAsync();

        public Task<Notification?> GetForUserAsync(int id, int userId) =>
            db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        // Bulk statements: run immediately in the database.
        public Task<int> MarkAllReadAsync(int userId) =>
            db.Notifications.Where(n => n.UserId == userId && n.Status == "unread")
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.Status, "read"));

        public Task<int> DeleteAllAsync(int userId) =>
            db.Notifications.Where(n => n.UserId == userId).ExecuteDeleteAsync();

        public void Add(Notification notification) => db.Notifications.Add(notification);
    }
}

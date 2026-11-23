// ============================================================================
// FILE:    Services/NotificationService.cs
// OWNER:   Lopez, Mary Vincent
// WBS:     12.2 Notifications API
// PURPOSE: Creates notifications (used by enrollment, announcements, end of semester, password reset)
//          and serves a user's own notifications.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class NotificationService(INotificationRepository notifications, IUnitOfWork uow)
    {
        // Adds a Notification row. It is saved by the caller's UnitOfWork save.
        public void Notify(int userId, string title, string message, string type = "info")
        {
            notifications.Add(new Notification
            {
                UserId = userId,
                Title = title.Length > 200 ? title[..200] : title,
                Message = message.Length > 1000 ? message[..1000] : message,
                Type = type,
            });
        }

        public void NotifyMany(IEnumerable<int> userIds, string title, string message, string type = "info")
        {
            foreach (var id in userIds.Distinct()) Notify(id, title, message, type);
        }

        // Newest first. Capped at the latest 100 so the bell panel stays light.
        public async Task<ServiceResult<List<NotificationDto>>> ListAsync(Caller caller) =>
            (await notifications.ListForUserAsync(caller.Id, 100)).Select(ToDto).ToList();

        public async Task<ServiceResult<NotificationDto>> MarkReadAsync(int id, Caller caller)
        {
            // Someone else's notification answers 404, so ids cannot be probed.
            var n = await notifications.GetForUserAsync(id, caller.Id);
            if (n is null) return Fail.NotFound("Notification not found.");
            n.Status = "read";
            await uow.SaveChangesAsync();
            return ToDto(n);
        }

        public async Task<ServiceResult<BulkUpdateResultDto>> MarkAllReadAsync(Caller caller) =>
            new BulkUpdateResultDto(true, await notifications.MarkAllReadAsync(caller.Id));

        public async Task<ServiceResult<BulkDeleteResultDto>> ClearAsync(Caller caller) =>
            new BulkDeleteResultDto(true, await notifications.DeleteAllAsync(caller.Id));

        private static NotificationDto ToDto(Notification n) => new(n.Id, n.Title, n.Message, n.Type, n.Status, n.CreatedAt);
    }
}

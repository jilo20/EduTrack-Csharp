// ============================================================================
// FILE:    Services/NotificationService.cs
// OWNER:   Lopez, Mary Vincent
// WBS:     12.2 Notifications API
// PURPOSE: One place to create notifications, used by other controllers.
//
// TO BUILD: Notify(userId, title, message, type) that adds a Notification row.
// USED BY: enrollment, announcements, end of semester.
//
// ============================================================================

using Edutrack.Data;
using Edutrack.Models;

namespace Edutrack.Services
{
    public class NotificationService(EduTrackContext db)
    {
        // Adds a Notification row. It is saved by the caller's SaveChangesAsync.
        public void Notify(int userId, string title, string message, string type = "info")
        {
            db.Notifications.Add(new Notification
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
    }
}

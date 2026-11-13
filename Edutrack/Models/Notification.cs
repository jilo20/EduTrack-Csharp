// ============================================================================
// FILE:    Models/Notification.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for Notification.
//
// FIELDS: UserId (FK User), Title (200), Message, Type (info / announcement / warning), Status (unread / read), CreatedAt.
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddNotification
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class Notification
    {
        public int Id { get; set; }
        [Required] public int UserId { get; set; }
        public User? User { get; set; }
        [Required][MaxLength(200)] public required string Title { get; set; }
        [Required][MaxLength(1000)] public required string Message { get; set; }
        [Required][MaxLength(20)][AllowedValues("info", "announcement", "warning")] public string Type { get; set; } = "info";
        [Required][MaxLength(10)][AllowedValues("unread", "read")] public string Status { get; set; } = "unread";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

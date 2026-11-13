// ============================================================================
// FILE:    Models/AuditLog.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for AuditLog.
//
// FIELDS: Timestamp, Action (100), ActorId? (FK User), ActorName, ActorRole, Details.
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddAuditLog
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        [Required][MaxLength(100)] public required string Action { get; set; }
        public int? ActorId { get; set; }
        public User? Actor { get; set; }
        [Required][MaxLength(100)] public required string ActorName { get; set; }
        [MaxLength(10)] public string? ActorRole { get; set; }
        [Required][MaxLength(500)] public required string Details { get; set; }
    }
}

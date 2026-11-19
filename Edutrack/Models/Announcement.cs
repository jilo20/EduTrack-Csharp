// ============================================================================
// FILE:    Models/Announcement.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for Announcement.
//
// FIELDS: Title (200), Content, Priority (normal / high / urgent), Target (all / teachers / students), SectionId? (FK), AuthorId? (FK User), Date.
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddAnnouncement
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class Announcement
    {
        public int Id { get; set; }
        [Required][MaxLength(200)] public required string Title { get; set; }
        [Required][MaxLength(1000)] public required string Content { get; set; }
        [Required][MaxLength(10)][AllowedValues("normal", "high", "urgent")] public string Priority { get; set; } = "normal";
        [Required][MaxLength(10)][AllowedValues("all", "teachers", "students")] public string Target { get; set; } = "all";
        public int? SectionId { get; set; }
        public Section? Section { get; set; }
        public int? AuthorId { get; set; }
        public User? Author { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
}

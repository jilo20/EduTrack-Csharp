// ============================================================================
// FILE:    Models/Assessment.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for Assessment.
//
// FIELDS: SectionId (FK), Title (200), Type / category (e.g. Quiz, Project, Module Exam), PerfectScore (int).
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddAssessment
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class Assessment
    {
        public int Id { get; set; }
        [Required] public int SectionId { get; set; }
        public Section? Section { get; set; }
        [Required][MaxLength(200)] public required string Title { get; set; }
        [Required][MaxLength(50)] public required string Type { get; set; }
        [Range(1, 999)] public int PerfectScore { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<Score> Scores { get; set; } = [];
    }
}

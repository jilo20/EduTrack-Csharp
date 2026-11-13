// ============================================================================
// FILE:    Models/Section.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for Section.
//
// FIELDS: A class. TeacherId (FK User), CodeName (50), CourseProgram (200), Description, Schedule (default TBA), Status (active / completed), EndedAt?, PassingGrade (default 60), and the category weights.
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddSection
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class Section
    {
        public int Id { get; set; }
        [Required] public int TeacherId { get; set; }
        public User? Teacher { get; set; }
        [Required][MaxLength(50)] public required string CodeName { get; set; }
        [Required][MaxLength(200)] public required string CourseProgram { get; set; }
        [MaxLength(500)] public string? Description { get; set; }
        [Required][MaxLength(100)] public string Schedule { get; set; } = "TBA";
        [Required][MaxLength(10)][AllowedValues("active", "completed")] public string Status { get; set; } = "active";
        public DateTime? EndedAt { get; set; }
        [Range(1, 100)] public int PassingGrade { get; set; } = 60;
        // Category -> weight in %, e.g. { "Quiz": 30, "Project": 30, "Module Exam": 40 }. Stored as JSON (see EdutrackContext).
        public Dictionary<string, int> Weights { get; set; } = DefaultWeights();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public static Dictionary<string, int> DefaultWeights() => new() { ["Quiz"] = 30, ["Project"] = 30, ["Module Exam"] = 40 };
    }
}

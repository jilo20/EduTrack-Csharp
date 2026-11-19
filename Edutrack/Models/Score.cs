// ============================================================================
// FILE:    Models/Score.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for Score.
//
// FIELDS: AssessmentId (FK), StudentId (FK User), Value (double), Status (default Graded). The pair (AssessmentId, StudentId) must be unique.
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddScore
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class Score
    {
        public int Id { get; set; }
        [Required] public int AssessmentId { get; set; }
        public Assessment? Assessment { get; set; }
        [Required] public int StudentId { get; set; }
        public User? Student { get; set; }
        public double Value { get; set; }
        [Required][MaxLength(20)] public string Status { get; set; } = "Graded";
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

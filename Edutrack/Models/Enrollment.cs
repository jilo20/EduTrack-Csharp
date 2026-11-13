// ============================================================================
// FILE:    Models/Enrollment.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for Enrollment.
//
// FIELDS: A student in a class. SectionId (FK), StudentId (FK User). The pair (SectionId, StudentId) must be unique.
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddEnrollment
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class Enrollment
    {
        public int Id { get; set; }
        [Required] public int SectionId { get; set; }
        public Section? Section { get; set; }
        [Required] public int StudentId { get; set; }
        public User? Student { get; set; }
        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    }
}

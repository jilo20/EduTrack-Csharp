// ============================================================================
// FILE:    Models/Attendance.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for Attendance.
//
// FIELDS: StudentId (FK User), SectionId (FK), Date (DateOnly), Status (Present / Late / Absent / No Class), Remarks. (StudentId, SectionId, Date) must be unique.
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddAttendance
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class Attendance
    {
        public const string Present = "Present", Late = "Late", Absent = "Absent", NoClass = "No Class";
        public static readonly string[] Statuses = [Present, Late, Absent, NoClass];

        public int Id { get; set; }
        [Required] public int StudentId { get; set; }
        public User? Student { get; set; }
        [Required] public int SectionId { get; set; }
        public Section? Section { get; set; }
        public DateOnly Date { get; set; }
        [Required][MaxLength(10)] public required string Status { get; set; }
        [MaxLength(200)] public string? Remarks { get; set; }
    }
}

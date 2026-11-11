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
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

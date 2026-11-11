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
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

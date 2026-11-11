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
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

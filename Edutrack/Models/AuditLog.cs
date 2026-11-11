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
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

// ============================================================================
// FILE:    Models/Notification.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for Notification.
//
// FIELDS: UserId (FK User), Title (200), Message, Type (info / announcement / warning), Status (unread / read), CreatedAt.
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddNotification
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

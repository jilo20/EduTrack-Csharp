// ============================================================================
// FILE:    Models/Announcement.cs
// OWNER:   Peter, Nathalie
// WBS:     3.1 Database Design & Migrations
// PURPOSE: Database table for Announcement.
//
// FIELDS: Title (200), Content, Priority (normal / high / urgent), Target (all / teachers / students), SectionId? (FK), AuthorId? (FK User), Date.
// THEN: add a DbSet for it in Data/EdutrackContext.cs, set the unique indexes there,
//       and create a migration: dotnet ef migrations add AddAnnouncement
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

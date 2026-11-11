// ============================================================================
// FILE:    Controllers/AnnouncementsController.cs
// OWNER:   Bazar, Angelo
// WBS:     12.1 Announcements API
// PURPOSE: Announcements.
//
// ENDPOINTS TO BUILD:
//   GET  /api/announcements   -> AnnouncementDto[] for the logged-in user's role and classes
//   POST /api/announcements   body: CreateAnnouncementDto
// RULES:
//   - Admin broadcast: target = all, teachers, or students.
//   - Teacher: can only post to one of their own classes (SectionId).
//   - Priority is normal, high, or urgent.
//   - Create a notification for every user who should see it.
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

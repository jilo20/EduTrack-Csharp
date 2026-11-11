// ============================================================================
// FILE:    Controllers/ClassesController.cs
// OWNER:   Bazar, Angelo
// WBS:     7.1 Create Class API, 7.2 My Classes / All Classes API, 7.3 Enrollment & Roster API
// PURPOSE: Classes (sections), enrollment, and roster.
//
// ENDPOINTS TO BUILD (Teacher / Admin):
//   GET  /api/classes?teacherId=   -> ClassDto[]  (teacher: own classes; admin: all classes)
//   POST /api/classes              body: CreateClassDto -> ClassDto
//   GET  /api/classes/{id}/roster  -> RosterDto (students + their scores)
//   POST /api/classes/{id}/enroll  body: EnrollStudentsDto
// RULES:
//   - A teacher can only create and open their own classes. An admin can do it for any teacher.
//   - A student cannot be enrolled twice in the same class.
//   - Notify the teacher when a student is enrolled (NotificationService).
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

// ============================================================================
// FILE:    Controllers/ReportsController.cs
// OWNER:   Bazar, Angelo
// WBS:     8.4 Class Report API, 8.5 Student Report API, 8.6 End Semester API
// PURPOSE: Reports and ending the semester.
//
// ENDPOINTS TO BUILD (Teacher / Admin):
//   GET  /api/classes/{id}/report                       -> ClassReportDto
//   GET  /api/classes/{id}/students/{studentId}/report  -> StudentReportDto
//   POST /api/classes/{id}/end-semester                 -> ClassReportDto (final)
// RULES for End Semester:
//   - Compute every student's final grade, set the class Status = "completed" and EndedAt = now.
//   - Notify each student (with their final grade) and every admin.
//   - Write an audit log.
// USES: Services/GradeService.cs
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

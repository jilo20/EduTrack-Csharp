// ============================================================================
// FILE:    Controllers/StudentsController.cs
// OWNER:   Lopez, Mary Vincent
// WBS:     10.1 Student Dashboard API, 10.2 Performance API, 10.3 Assessments List API
// PURPOSE: What a student sees about themselves.
//
// ENDPOINTS TO BUILD (the student themself, or an admin):
//   GET /api/students/{id}/dashboard    -> StudentDashboardDto (classes, GWA, latest scores, attendance summary)
//   GET /api/students/{id}/performance  -> PerformanceDto[] (grade per class with category breakdown)
//   GET /api/students/{id}/assessments  -> assessments of the student's classes with score and status
// RULES: a student can only request their own id. USES: Services/GradeService.cs
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

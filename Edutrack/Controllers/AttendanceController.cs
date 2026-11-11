// ============================================================================
// FILE:    Controllers/AttendanceController.cs
// OWNER:   Bazar, Angelo
// WBS:     9.1 Mark Attendance API, 9.2 Attendance Records API
// PURPOSE: Attendance.
//
// ENDPOINTS TO BUILD:
//   POST /api/attendance                   body: MarkAttendanceDto   (Teacher / Admin)
//   GET  /api/attendance?classId=&date=    -> AttendanceRecordDto[]  (Teacher / Admin)
//   GET  /api/students/{id}/attendance     -> AttendanceRecordDto[] + rate (the student or an admin)
// RULES:
//   - Status is Present, Late, Absent, or No Class.
//   - One record per student, class, and date (update it if it already exists).
//   - Write an audit log when attendance is marked.
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

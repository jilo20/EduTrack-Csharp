// ============================================================================
// FILE:    Services/GradeService.cs
// OWNER:   Bazar, Angelo
// WBS:     8.3 Grade Computation
// PURPOSE: All grade math lives here so every controller gets the same numbers.
//
// TO BUILD:
//   - ComputeClassGrade(studentId, classId):
//       category average = average of (score / perfect score) in that category
//       class grade %    = sum of (category average x category weight)
//   - ToGradePoint(percentage, passingGrade): convert to the 1.00 - 5.00 scale
//       below passing = 5.00, 100% = 1.00, in between = 1.0 + 2.0 x (100 - %) / (100 - passingGrade)
//   - ComputeGwa(studentId): average of the student's class grades
//   - AttendanceRate = (Present + Late x 0.5) / days, ignoring "No Class" days
// NOTE: default weights are Quiz 30%, Project 30%, Module Exam 40%; default passing grade is 60.
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

// ============================================================================
// FILE:    Controllers/AssessmentsController.cs
// OWNER:   Bazar, Angelo
// WBS:     8.1 Assessments API, 8.2 Scores API
// PURPOSE: Assessments and scores.
//
// ENDPOINTS TO BUILD (Teacher / Admin):
//   POST /api/assessments              body: CreateAssessmentDto -> AssessmentDto
//   POST /api/assessments/{id}/scores  body: SubmitScoresDto
// RULES:
//   - A score cannot be higher than the assessment's perfect score.
//   - One score per student per assessment (update it if it already exists).
//   - Write an audit log for every new grade and every grade change (old -> new).
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

// ============================================================================
// FILE:    Controllers/UsersController.cs
// OWNER:   Bazar, Angelo
// WBS:     6.1 Users API: Add / Edit, 6.2 Deactivate, 6.3 Lists
// PURPOSE: Admin manages user accounts.
//
// ENDPOINTS TO BUILD (Admin only):
//   GET    /api/users?role=Student|Teacher  -> UserDto[]   (also used as the student pool for enrollment)
//   POST   /api/users        body: CreateUserDto -> UserDto
//   PUT    /api/users/{id}   body: UpdateUserDto -> UserDto
//   DELETE /api/users/{id}   -> sets Status = "inactive" (do NOT delete the row)
// RULES: email must be unique. Write an audit log for create, update, and deactivate.
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

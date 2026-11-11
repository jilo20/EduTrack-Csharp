// ============================================================================
// FILE:    Services/TokenService.cs
// OWNER:   Bazar, Angelo
// WBS:     4.1 Login API, 4.5 Role-Based Authorization
// PURPOSE: Creates the JWT token that the frontend sends with every request.
//
// TO BUILD:
//   - CreateToken(User user): JWT with the user id, email, and role as claims.
//   - Register JWT authentication in Program.cs (AddAuthentication + AddJwtBearer).
//   - Put [Authorize(Roles = "Admin")] etc. on the controllers.
// RULES:
//   - Admin: full access. Teacher: own classes only. Student: own data only.
//   - Keep the signing key in appsettings / user secrets, never in code.
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

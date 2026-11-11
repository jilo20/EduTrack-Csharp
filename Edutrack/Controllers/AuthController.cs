// ============================================================================
// FILE:    Controllers/AuthController.cs
// OWNER:   Bazar, Angelo
// WBS:     4.1 Login API, 4.2 Account Lockout, 4.3 Verify Invite ID API, 4.4 Register API
// PURPOSE: Login and registration.
//
// ENDPOINTS TO BUILD:
//   POST /api/auth/login      body: LoginDto      -> AuthResponseDto { token, user }
//   POST /api/auth/verify-id  body: VerifyIdDto   -> { valid, role }
//   POST /api/auth/register   body: RegisterDto   -> AuthResponseDto
// RULES:
//   - Login: wrong password adds 1 to User.LoginAttempts. At 5, set User.LockUntil and refuse login until then.
//   - Login: a successful login resets LoginAttempts to 0. Inactive users cannot log in.
//   - Verify: the ID must exist in RegisteredIds with IsUsed = false.
//   - Register: copy the role from the invite, hash the password, then set the invite IsUsed = true.
// USES: Services/TokenService.cs, Dtos/Auth/*
//
// STATUS:  EMPTY - not started. Delete this line when you begin.
// ============================================================================

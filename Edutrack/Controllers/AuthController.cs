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
//   GET  /api/auth/me         (logged in)         -> UserDto
//   POST /api/auth/forgot-password/request body: RequestPasswordResetDto -> { ok }
//   POST /api/auth/forgot-password/reset   body: ResetPasswordDto  -> { ok }
// RULES:
//   - Login: wrong password adds 1 to User.LoginAttempts. At 5, set User.LockUntil and refuse login until then.
//   - Login: a successful login resets LoginAttempts to 0. Inactive users cannot log in.
//   - Verify: the ID must exist in RegisteredIds with IsUsed = false.
//   - Register: copy the role from the invite, hash the password, then set the invite IsUsed = true.
//   - Forgot Password: send a reset link to the account email in local development.
// USES: Services/TokenService.cs, Dtos/Auth/*
//
//
// ARCHITECTURE: Controller -> Service -> Repository. This controller only calls the service;
//               the rules are in Services/, the database work in Repositories/.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Edutrack.Controllers
{
    [Route("/api/auth")]
    public class AuthController(AuthService auth, PasswordResetQueue resets) : ApiControllerBase
    {
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDto dto) => Respond(await auth.LoginAsync(dto));

        [HttpPost("verify-id")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyId(VerifyIdDto dto) => Respond(await auth.VerifyInviteAsync(dto));

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(RegisterDto dto) => Respond(await auth.RegisterAsync(dto));

        [HttpPost("forgot-password/request")]
        [AllowAnonymous]
        [EnableRateLimiting("password-reset")]
        public IActionResult RequestPasswordReset(RequestPasswordResetDto dto) =>
            resets.TryEnqueue(dto.Email)
                ? Ok(new OkResultDto(true))
                : StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "Please try again shortly." });

        [HttpPost("forgot-password/reset")]
        [AllowAnonymous]
        [EnableRateLimiting("password-reset")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto) => Respond(await auth.ResetPasswordAsync(dto));

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me() => Respond(await auth.MeAsync(Caller));
    }
}

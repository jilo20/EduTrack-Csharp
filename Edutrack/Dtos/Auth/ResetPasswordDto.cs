// ============================================================================
// FILE:    Dtos/Auth/ResetPasswordDto.cs
// OWNER:   Bazar, Angelo
// WBS:     4.3 Forgot Password
// PURPOSE: Input for POST /api/auth/forgot-password/reset.
//          Step 1 (verify) reuses VerifyIdDto.
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record ResetPasswordDto(
        [Required][StringLength(20)] string IdNumber,
        [Required][StringLength(100, MinimumLength = 8)] string Password
    );
}

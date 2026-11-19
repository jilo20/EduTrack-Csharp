// ============================================================================
// FILE:    Dtos/Auth/RegisterDto.cs
// OWNER:   Bazar, Angelo
// WBS:     4.1 - 4.4
// PURPOSE: Input. IdNumber, FirstName, LastName, Email, Password (min 8 characters).
//
// WRITE IT AS: public record RegisterDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Auth, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record RegisterDto(
        [Required][StringLength(20)] string IdNumber,
        [Required][StringLength(50)] string FirstName,
        [Required][StringLength(50)] string LastName,
        [Required][EmailAddress][StringLength(50)] string Email,
        [Required][StringLength(100, MinimumLength = 8)] string Password
    );
}

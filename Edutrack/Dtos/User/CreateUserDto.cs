// ============================================================================
// FILE:    Dtos/User/CreateUserDto.cs
// OWNER:   Bazar, Angelo
// WBS:     6.1 - 6.3
// PURPOSE: Input. FirstName, LastName, Email, Password, RoleId.
//
// WRITE IT AS: public record CreateUserDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.User, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record CreateUserDto(
        [Required][StringLength(50)] string FirstName,
        [Required][StringLength(50)] string LastName,
        [Required][EmailAddress][StringLength(50)] string Email,
        [Required][StringLength(100, MinimumLength = 8)] string Password,
        [Range(1, 3)] int RoleId
    );
}

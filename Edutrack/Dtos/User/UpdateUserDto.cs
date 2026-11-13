// ============================================================================
// FILE:    Dtos/User/UpdateUserDto.cs
// OWNER:   Bazar, Angelo
// WBS:     6.1 - 6.3
// PURPOSE: Input. FirstName, LastName, Email, RoleId, Status.
//
// WRITE IT AS: public record UpdateUserDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.User, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record UpdateUserDto(
        [Required][StringLength(50)] string FirstName,
        [Required][StringLength(50)] string LastName,
        [Required][EmailAddress][StringLength(50)] string Email,
        [Range(1, 3)] int RoleId,
        [Required][AllowedValues("active", "inactive")] string Status
    );
}

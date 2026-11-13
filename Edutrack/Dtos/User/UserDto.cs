// ============================================================================
// FILE:    Dtos/User/UserDto.cs
// OWNER:   Bazar, Angelo
// WBS:     6.1 - 6.3
// PURPOSE: Output. Id, FirstName, LastName, Email, Role (name), IdNumber, Status. Never include the password.
//
// WRITE IT AS: public record UserDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.User, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using Edutrack.Models;

namespace Edutrack.Dtos
{
    public record UserDto(
        int Id,
        string FirstName,
        string LastName,
        string Email,
        string Role,
        string? IdNumber,
        string Status
    )
    {
        // The user must be loaded with .Include(u => u.Role).
        public static UserDto From(User u) =>
            new(u.Id, u.FirstName, u.LastName, u.Email, u.Role!.Name, u.IdNumber, u.Status);
    }
}

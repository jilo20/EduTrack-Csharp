// ============================================================================
// FILE:    Dtos/Auth/VerifyIdDto.cs
// OWNER:   Bazar, Angelo
// WBS:     4.1 - 4.4
// PURPOSE: Input. IdNumber (required, max 20).
//
// WRITE IT AS: public record VerifyIdDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Auth, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record VerifyIdDto(
        [Required][StringLength(20)] string IdNumber
    );
}

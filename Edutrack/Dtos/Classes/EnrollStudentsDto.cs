// ============================================================================
// FILE:    Dtos/Classes/EnrollStudentsDto.cs
// OWNER:   Bazar, Angelo
// WBS:     7.1 - 7.3
// PURPOSE: Input. StudentIds (list of user ids).
//
// WRITE IT AS: public record EnrollStudentsDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Classes, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record EnrollStudentsDto(
        [Required][MinLength(1)] List<int> StudentIds
    );
}

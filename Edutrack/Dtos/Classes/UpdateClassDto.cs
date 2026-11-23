// ============================================================================
// FILE:    Dtos/Classes/UpdateClassDto.cs
// OWNER:   Bazar, Angelo
// WBS:     7.1 Create / Update Class
// PURPOSE: Input for PUT /api/classes/{id}. Same limits as CreateClassDto.
//          Grading weights are changed separately with PUT /api/classes/{id}/weights.
// NAMESPACE:   Edutrack.Dtos
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record UpdateClassDto(
        [Required][StringLength(200, MinimumLength = 3)] string Name,
        [Required][StringLength(50, MinimumLength = 2)] string SectionCode,
        [StringLength(500)] string? Description,
        [StringLength(100)] string? Schedule,
        [Range(1, 100)] int PassingGrade
    );
}

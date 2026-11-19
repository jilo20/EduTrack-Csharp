// ============================================================================
// FILE:    Dtos/Assessments/CreateAssessmentDto.cs
// OWNER:   Bazar, Angelo
// WBS:     8.1 - 8.2
// PURPOSE: Input. SectionId, Title, Type (category), PerfectScore (1 or more).
//
// WRITE IT AS: public record CreateAssessmentDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Assessments, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record CreateAssessmentDto(
        [Range(1, int.MaxValue)] int SectionId,
        [Required][StringLength(150, MinimumLength = 3)] string Title,
        [Required][StringLength(50)] string Type,
        [Range(1, 999)] int PerfectScore
    );
}

// ============================================================================
// FILE:    Dtos/Assessments/AssessmentDto.cs
// OWNER:   Bazar, Angelo
// WBS:     8.1 - 8.2
// PURPOSE: Output. Id, SectionId, Title, Type, PerfectScore.
//
// WRITE IT AS: public record AssessmentDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Assessments, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    public record AssessmentDto(int Id, int SectionId, string Title, string Type, int PerfectScore);
}

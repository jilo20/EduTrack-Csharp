// ============================================================================
// FILE:    Dtos/Assessments/SubmitScoresDto.cs
// OWNER:   Bazar, Angelo
// WBS:     8.1 - 8.2
// PURPOSE: Input. A list of { StudentId, Score }.
//
// WRITE IT AS: public record SubmitScoresDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Assessments, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    // Reason is optional; it is written to the audit log when a grade is changed.
    public record SubmitScoresDto(
        [Required][MinLength(1)] List<ScoreEntryDto> Scores,
        [StringLength(200)] string? Reason = null
    );

    public record ScoreEntryDto(
        [Range(1, int.MaxValue)] int StudentId,
        [Range(0, 999)] double Score
    );
}

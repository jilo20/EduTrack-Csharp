// ============================================================================
// FILE:    Dtos/Classes/RosterDto.cs
// OWNER:   Bazar, Angelo
// WBS:     7.1 - 7.3
// PURPOSE: Output. The class plus each student (Id, Name, Email, IdNumber) and their scores.
//
// WRITE IT AS: public record RosterDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Classes, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    public record RosterDto(int ClassId, string ClassName, string SectionCode, List<AssessmentDto> Assessments, List<RosterStudentDto> Students);

    // Scores: assessment id -> score. A missing id means the score is still pending.
    public record RosterStudentDto(int Id, string Name, string Email, string IdNumber, Dictionary<int, double> Scores);
}

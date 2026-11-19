// ============================================================================
// FILE:    Dtos/Classes/ClassDto.cs
// OWNER:   Bazar, Angelo
// WBS:     7.1 - 7.3
// PURPOSE: Output. Id, Name, SectionCode, Teacher (name), Schedule, Status, StudentCount, Weights, PassingGrade.
//
// WRITE IT AS: public record ClassDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Classes, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using Edutrack.Models;

namespace Edutrack.Dtos
{
    public record ClassDto(
        int Id,
        string Name,
        string SectionCode,
        int TeacherId,
        string Teacher,
        string Schedule,
        string? Description,
        string Status,
        int StudentCount,
        Dictionary<string, int> Weights,
        int PassingGrade,
        DateTime? EndedAt
    )
    {
        // The section must be loaded with .Include(s => s.Teacher).
        public static ClassDto From(Section s, int studentCount) =>
            new(s.Id, s.CourseProgram, s.CodeName, s.TeacherId, $"{s.Teacher!.FirstName} {s.Teacher.LastName}",
                s.Schedule, s.Description, s.Status, studentCount, s.Weights, s.PassingGrade, s.EndedAt);
    }
}

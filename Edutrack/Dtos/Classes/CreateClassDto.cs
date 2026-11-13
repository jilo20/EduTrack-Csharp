// ============================================================================
// FILE:    Dtos/Classes/CreateClassDto.cs
// OWNER:   Bazar, Angelo
// WBS:     7.1 - 7.3
// PURPOSE: Input. Name (course / program), SectionCode, TeacherId, Description, Schedule, Categories, Weights, PassingGrade.
//
// WRITE IT AS: public record CreateClassDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Classes, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    // Weights: category -> %, must total 100. Leave it out to use Quiz 30 / Project 30 / Module Exam 40.
    // TeacherId: required for an admin; a teacher always creates the class for themself.
    public record CreateClassDto(
        [Required][StringLength(200, MinimumLength = 3)] string Name,
        [Required][StringLength(50, MinimumLength = 2)] string SectionCode,
        int? TeacherId,
        [StringLength(500)] string? Description,
        [StringLength(100)] string? Schedule,
        List<string>? Categories,
        Dictionary<string, int>? Weights,
        [Range(1, 100)] int PassingGrade = 60
    );
}

// OWNER: Lopez, Mary Vincent — WBS 10.1–10.3
namespace Edutrack.Dtos;

public record PerformanceDto(
    int ClassId, string ClassName, double? Grade, double? EquivalentGrade,
    string? Description, List<CategoryResultDto> Categories);

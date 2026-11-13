// ============================================================================
// FILE:    Dtos/Reports/StudentReportDto.cs
// OWNER:   Bazar, Angelo
// WBS:     8.4 - 8.6
// PURPOSE: Output. One student's scores per assessment, class grade, equivalent grade, and attendance summary.
//
// WRITE IT AS: public record StudentReportDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Reports, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    public record StudentReportDto(
        StudentRefDto Student,
        int ClassId,
        string ClassName,
        double? Grade,
        double? EquivalentGrade,
        string? Description,
        List<StudentScoreDto> Scores,
        List<CategoryResultDto> Categories,
        AttendanceSummaryDto Attendance
    );

    public record StudentRefDto(int Id, string Name);

    // Status is GRADED or PENDING (no score yet). Pending scores are not counted in the grade.
    public record StudentScoreDto(int AssessmentId, string Assessment, string Type, double? Score, int PerfectScore, string Status);

    public record CategoryResultDto(string Type, double? Average, int Weight);

    public record AttendanceSummaryDto(int Present, int Late, int Absent, int NoClass, double? Rate);
}

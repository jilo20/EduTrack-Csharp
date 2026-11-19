// OWNER: Lopez, Mary Vincent — WBS 10.1–10.3
namespace Edutrack.Dtos;

// Gwa is the average percentage used by the existing student pages and mocks.
public record StudentDashboardDto(
    double? Gwa, double? EquivalentGrade, double? AttendanceRate,
    List<StudentDashboardClassDto> Classes, List<StudentLatestScoreDto> LatestScores);
public record StudentDashboardClassDto(int Id, string Name, string SectionCode, string Teacher, double? Grade);
public record StudentLatestScoreDto(string Assessment, string ClassName, double Score, int PerfectScore);
public record StudentAssessmentDto(
    int Id, string ClassName, string Title, string Type, double? Score, int PerfectScore, string Status);

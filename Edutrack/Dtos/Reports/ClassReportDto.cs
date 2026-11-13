// ============================================================================
// FILE:    Dtos/Reports/ClassReportDto.cs
// OWNER:   Bazar, Angelo
// WBS:     8.4 - 8.6
// PURPOSE: Output. ClassName, SectionCode, TotalStudents, ClassAverage, ClassAverageEquivalent, AttendanceRate, PassingCount, and per student: Name, Grade, EquivalentGrade, AttendanceRate.
//
// WRITE IT AS: public record ClassReportDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Reports, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    public record ClassReportDto(
        int ClassId,
        string ClassName,
        string SectionCode,
        string Status,
        int PassingGrade,
        int TotalStudents,
        double? ClassAverage,
        double? ClassAverageEquiv,
        double? AttendanceRate,
        int PassingCount,
        List<ClassReportStudentDto> Students
    );

    public record ClassReportStudentDto(int Id, string Name, string Email, double? Grade, double? EquivalentGrade, double? AttendanceRate);
}

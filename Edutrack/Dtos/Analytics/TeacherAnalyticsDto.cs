// ============================================================================
// FILE:    Dtos/Analytics/TeacherAnalyticsDto.cs
// OWNER:   Bazar, Angelo
// WBS:     11.1 - 11.3
// PURPOSE: Output. Per class: average grade, passing rate, attendance rate.
//
// WRITE IT AS: public record TeacherAnalyticsDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Analytics, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    public record TeacherAnalyticsDto(TeacherTotalsDto Totals, List<ClassStatsDto> Classes);

    public record TeacherTotalsDto(int Classes, int Students, int Assessments);

    public record ClassStatsDto(int ClassId, string Name, double? Average, double? PassingRate, double? AttendanceRate);
}

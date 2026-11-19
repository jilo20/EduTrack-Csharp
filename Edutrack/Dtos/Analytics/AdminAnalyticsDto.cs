// ============================================================================
// FILE:    Dtos/Analytics/AdminAnalyticsDto.cs
// OWNER:   Bazar, Angelo
// WBS:     11.1 - 11.3
// PURPOSE: Output. TotalStudents, TotalTeachers, TotalClasses, ActiveUsers, and chart data.
//
// WRITE IT AS: public record AdminAnalyticsDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Analytics, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    public record AdminAnalyticsDto(
        AdminTotalsDto Totals,
        List<ClassEnrollmentDto> EnrollmentPerClass,
        List<PerformanceBucketDto> Performance,
        AttendanceSplitDto Attendance
    );

    public record AdminTotalsDto(int Students, int Teachers, int Classes, int ActiveUsers);

    public record ClassEnrollmentDto(string Name, int Students);

    // Name: Excellent, Very Good, Good, Passing, Failed.
    public record PerformanceBucketDto(string Name, int Count);

    // Percent of attendance records (No Class days left out).
    public record AttendanceSplitDto(double Present, double Late, double Absent);
}

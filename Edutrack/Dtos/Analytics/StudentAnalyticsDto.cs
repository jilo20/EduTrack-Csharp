// ============================================================================
// FILE:    Dtos/Analytics/StudentAnalyticsDto.cs
// OWNER:   Bazar, Angelo
// WBS:     11.1 - 11.3
// PURPOSE: Output. The student's scores over time and per category.
//
// WRITE IT AS: public record StudentAnalyticsDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Analytics, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    public record StudentAnalyticsDto(List<TrendPointDto> Trend, List<CategoryAverageDto> ByCategory);

    // Score in %, oldest assessment first.
    public record TrendPointDto(string Name, double Score);

    public record CategoryAverageDto(string Type, double Average);
}

// ============================================================================
// FILE:    Dtos/Attendance/MarkAttendanceDto.cs
// OWNER:   Bazar, Angelo
// WBS:     9.1 - 9.2
// PURPOSE: Input. SectionId, Date, and a list of { StudentId, Status, Remarks }.
//
// WRITE IT AS: public record MarkAttendanceDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Attendance, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record MarkAttendanceDto(
        [Range(1, int.MaxValue)] int SectionId,
        DateOnly Date,
        [Required][MinLength(1)] List<AttendanceEntryDto> Records
    );

    // Status: Present, Late, Absent, or No Class.
    public record AttendanceEntryDto(
        [Range(1, int.MaxValue)] int StudentId,
        [Required][StringLength(10)] string Status,
        [StringLength(200)] string? Remarks
    );
}

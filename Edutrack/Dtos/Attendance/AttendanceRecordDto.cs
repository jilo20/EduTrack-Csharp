// ============================================================================
// FILE:    Dtos/Attendance/AttendanceRecordDto.cs
// OWNER:   Bazar, Angelo
// WBS:     9.1 - 9.2
// PURPOSE: Output. StudentId, StudentName, SectionId, Date, Status, Remarks.
//
// WRITE IT AS: public record AttendanceRecordDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Attendance, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    // Status is null when the student has not been marked yet for that date.
    public record AttendanceRecordDto(int StudentId, string StudentName, int SectionId, DateOnly Date, string? Status, string? Remarks);

    // GET /api/students/{id}/attendance
    public record StudentAttendanceDto(int StudentId, double? Rate, List<ClassAttendanceDto> Classes);

    public record ClassAttendanceDto(int ClassId, string ClassName, double? Rate, List<AttendanceDayDto> Records);

    public record AttendanceDayDto(DateOnly Date, string Status, string? Remarks);
}

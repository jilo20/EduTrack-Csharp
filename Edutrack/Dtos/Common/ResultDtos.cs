// ============================================================================
// FILE:    Dtos/Common/ResultDtos.cs
// PURPOSE: Small output DTOs for actions that return a summary instead of a full object.
//          The JSON shape is the same as the anonymous objects the controllers returned before.
// ============================================================================

namespace Edutrack.Dtos
{
    public record EnrollResultDto(int ClassId, int Enrolled, int AlreadyEnrolled);

    public record WeightsResultDto(int ClassId, Dictionary<string, int> Weights);

    public record SaveScoresResultDto(int AssessmentId, int Saved, int Added, int Changed);

    public record SavedCountDto(int Saved);

    public record OkResultDto(bool Ok);

    public record BulkUpdateResultDto(bool Ok, int Updated);

    public record BulkDeleteResultDto(bool Ok, int Deleted);

    public record VerifyInviteResultDto(bool Valid, string? Role);

}

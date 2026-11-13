// ============================================================================
// FILE:    Dtos/AuditLogs/AuditLogDto.cs
// OWNER:   Bazar, Angelo
// WBS:     13.2
// PURPOSE: Output. Id, Timestamp, Action, ActorName, ActorRole, Details.
//
// WRITE IT AS: public record AuditLogDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.AuditLogs, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    public record AuditLogDto(int Id, DateTime Timestamp, string Action, string ActorName, string? ActorRole, string Details);
}

// ============================================================================
// FILE:    Dtos/Announcements/CreateAnnouncementDto.cs
// OWNER:   Bazar, Angelo
// WBS:     12.1
// PURPOSE: Input. Title, Content, Priority, Target, SectionId (optional).
//
// WRITE IT AS: public record CreateAnnouncementDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Announcements, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    // Priority: normal, high, or urgent. Target: all, teachers, or students.
    // SectionId: post to one class (required for a teacher; the target is then the class's students).
    public record CreateAnnouncementDto(
        [Required][StringLength(200, MinimumLength = 3)] string Title,
        [Required][StringLength(1000, MinimumLength = 1)] string Content,
        string? Priority,
        string? Target,
        int? SectionId
    );
}

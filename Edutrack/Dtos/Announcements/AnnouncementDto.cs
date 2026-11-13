// ============================================================================
// FILE:    Dtos/Announcements/AnnouncementDto.cs
// OWNER:   Bazar, Angelo
// WBS:     12.1
// PURPOSE: Output. Id, Title, Content, Priority, Target, ClassName, Author (name), Date.
//
// WRITE IT AS: public record AnnouncementDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Announcements, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

using Edutrack.Models;

namespace Edutrack.Dtos
{
    public record AnnouncementDto(int Id, string Title, string Content, string Priority, string Target,
        int? ClassId, string? ClassName, string? Author, DateOnly Date)
    {
        // The announcement must be loaded with .Include(a => a.Section).Include(a => a.Author).
        public static AnnouncementDto From(Announcement a) =>
            new(a.Id, a.Title, a.Content, a.Priority, a.Target, a.SectionId, a.Section?.CourseProgram,
                a.Author is null ? null : $"{a.Author.FirstName} {a.Author.LastName}", DateOnly.FromDateTime(a.Date));
    }
}

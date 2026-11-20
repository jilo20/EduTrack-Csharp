// ============================================================================
// FILE:    Dtos/Notifications/NotificationDto.cs
// OWNER:   Lopez, Mary Vincent
// WBS:     12.2
// PURPOSE: Output. Id, Title, Message, Type, Status, CreatedAt.
//
// WRITE IT AS: public record NotificationDto( ... );
// NAMESPACE:   Edutrack.Dtos   (not Edutrack.Dtos.Notifications, even though the file is in a subfolder)
// Put validation ([Required], [StringLength], [Range]) on INPUT DTOs only.
//
// ============================================================================

namespace Edutrack.Dtos
{
    public record NotificationDto(int Id, string Title, string Message, string Type, string Status, DateTime CreatedAt);
}

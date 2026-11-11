using Edutrack.Models;
using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record RegisteredIdDto(
        int Id,
        string IdNumber,
        string Role,
        bool IsUsed,
        DateTime CreatedAt
    );
}

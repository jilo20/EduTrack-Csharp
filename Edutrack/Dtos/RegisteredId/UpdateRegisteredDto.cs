using Edutrack.Models;
using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record UpdateRegisteredIdDto(
        string IdNumber,
        int RoleId,
        bool IsUsed
    );
}

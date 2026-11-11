using Edutrack.Models;
using System.ComponentModel.DataAnnotations;

namespace Edutrack.Dtos
{
    public record CreateRegisteredIdDto(
        string IdNumber,

        int RoleId
    );
}

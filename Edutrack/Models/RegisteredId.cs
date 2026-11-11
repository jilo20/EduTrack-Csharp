using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class RegisteredId
    {
        public int Id { get; set; }
        [Required][MaxLength(20)] public required string IdNumber { get; set; }
        [Required] public int RoleId { get; set; }
        public Role? Role { get; set; }
        [Required] public bool IsUsed { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

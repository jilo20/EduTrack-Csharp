using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class User
    {
        public int Id { get; set; }
        [Required][MaxLength(50)] public required string FirstName { get; set; }
        [Required][MaxLength(50)] public required string LastName { get; set; }
        [Required] public required int RoleId { get; set; }
        public Role? Role { get; set; }
        [Required][MaxLength(20)] public required string IdNumber { get; set; }
        [Required][MaxLength(50)] public required string Email { get; set; }
        [Required][MaxLength(100)] public required string Password { get; set; }
        [Required][MaxLength(10)] public required string Status { get; set; }
        [Range(0,5)]public int LoginAttempts { get; set; }
        public DateTime? LockUntil { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}

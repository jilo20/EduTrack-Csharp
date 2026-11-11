using System.ComponentModel.DataAnnotations;

namespace Edutrack.Models
{
    public class Role
    {
        public int Id { get; set; }
        [Required][MaxLength(10)][AllowedValues("Admin", "Teacher", "Student")] public required string Name { get; set; }
    }
}

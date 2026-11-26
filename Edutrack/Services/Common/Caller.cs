// ============================================================================
// FILE:    Services/Common/Caller.cs
// PURPOSE: The logged-in user, as the service layer sees it (id + role from the JWT).
//          Controllers build it with User.ToCaller(); services use it for permission rules.
// ============================================================================

using Edutrack.Models;

namespace Edutrack.Services
{
    public record Caller(int Id, string Role)
    {
        public bool IsAdmin => Role == "Admin";
        public bool IsTeacher => Role == "Teacher";
        public bool IsStudent => Role == "Student";

        // Admin, or the teacher who owns the class.
        public bool CanManage(Section section) => IsAdmin || section.TeacherId == Id;

        // Admin, or the user asking about themself.
        public bool IsSelfOrAdmin(int userId) => IsAdmin || Id == userId;
    }
}

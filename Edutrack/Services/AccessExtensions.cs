// ============================================================================
// FILE:    Services/AccessExtensions.cs
// OWNER:   Bazar, Angelo
// WBS:     4.5 Role-Based Authorization
// PURPOSE: Small helpers for "who is calling" checks, shared by every controller.
// ============================================================================

using System.Security.Claims;
using Edutrack.Models;

namespace Edutrack.Services
{
    public static class AccessExtensions
    {
        // The user id stored in the JWT ("sub" claim).
        public static int UserId(this ClaimsPrincipal user) => int.Parse(user.Identity!.Name!);

        public static bool IsAdmin(this ClaimsPrincipal user) => user.IsInRole("Admin");

        // Admin, or the teacher who owns the class.
        public static bool CanManage(this ClaimsPrincipal user, Section section) =>
            user.IsAdmin() || section.TeacherId == user.UserId();

        // Admin, or the user asking about themself.
        public static bool IsSelfOrAdmin(this ClaimsPrincipal user, int id) => user.IsAdmin() || user.UserId() == id;
    }
}

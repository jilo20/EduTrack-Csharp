// ============================================================================
// FILE:    Services/AccessExtensions.cs
// OWNER:   Bazar, Angelo
// WBS:     4.5 Role-Based Authorization
// PURPOSE: Reads "who is calling" from the JWT. Controllers pass the result (a Caller) to the
//          service layer, where the permission rules live (see Services/Common/Caller.cs).
// ============================================================================

using System.Security.Claims;

namespace Edutrack.Services
{
    public static class AccessExtensions
    {
        // The user id stored in the JWT ("sub" claim).
        public static int UserId(this ClaimsPrincipal user) => int.Parse(user.Identity!.Name!);

        public static Caller ToCaller(this ClaimsPrincipal user) =>
            new(int.TryParse(user.Identity?.Name, out var id) ? id : 0, user.FindFirst(TokenService.RoleClaim)?.Value ?? "");
    }
}

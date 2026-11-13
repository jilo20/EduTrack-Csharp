// ============================================================================
// FILE:    Services/TokenService.cs
// OWNER:   Bazar, Angelo
// WBS:     4.1 Login API, 4.5 Role-Based Authorization
// PURPOSE: Creates the JWT token that the frontend sends with every request.
//
// TO BUILD:
//   - CreateToken(User user): JWT with the user id, email, and role as claims.
//   - Register JWT authentication in Program.cs (AddAuthentication + AddJwtBearer).
//   - Put [Authorize(Roles = "Admin")] etc. on the controllers.
// RULES:
//   - Admin: full access. Teacher: own classes only. Student: own data only.
//   - Keep the signing key in appsettings / user secrets, never in code.
//
// ============================================================================

using System.Security.Claims;
using System.Text;
using Edutrack.Models;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Edutrack.Services
{
    public class TokenService(IConfiguration config)
    {
        // Claim names inside the token. Program.cs reads the role from "role".
        public const string IdClaim = "sub";
        public const string EmailClaim = "email";
        public const string RoleClaim = "role";

        public string CreateToken(User user, string role)
        {
            var jwt = config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetKey(config)));
            var minutes = jwt.GetValue("ExpiresMinutes", 120);

            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(
                [
                    new Claim(IdClaim, user.Id.ToString()),
                    new Claim(EmailClaim, user.Email),
                    new Claim(RoleClaim, role),
                ]),
                Issuer = jwt["Issuer"],
                Audience = jwt["Audience"],
                Expires = DateTime.UtcNow.AddMinutes(minutes),
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256),
            };
            return new JsonWebTokenHandler().CreateToken(descriptor);
        }

        // The key comes from configuration (appsettings.Development.json locally, the Jwt__Key environment variable in production).
        public static string GetKey(IConfiguration config)
        {
            var key = config["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(key) || key.Length < 32)
                throw new InvalidOperationException("Jwt:Key is missing or shorter than 32 characters. Set it in appsettings.Development.json or the Jwt__Key environment variable.");
            return key;
        }
    }
}

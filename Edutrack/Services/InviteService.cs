// ============================================================================
// FILE:    Services/InviteService.cs
// OWNER:   Lopez, Mary Vincent
// WBS:     5.1 Invites API
// PURPOSE: Admin generates invite IDs (year + 6 random digits) for Teachers and Students.
// ============================================================================

using System.Security.Cryptography;
using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class InviteService(IInviteRepository invites, IUserRepository users, IUnitOfWork uow, AuditLogService audit)
    {
        public async Task<ServiceResult<List<RegisteredIdDto>>> ListAsync() =>
            (await invites.ListAsync()).Select(ToDto).ToList();

        public async Task<ServiceResult<RegisteredIdDto>> GetAsync(int id)
        {
            var invite = await invites.GetByIdAsync(id);
            return invite is null ? Fail.NotFound("Invite not found.") : ToDto(invite);
        }

        public async Task<ServiceResult<RegisteredIdDto>> CreateAsync(int roleId, Caller caller)
        {
            var role = await users.GetRoleAsync(roleId);
            if (role is null || (role.Name != "Student" && role.Name != "Teacher"))
                return Fail.BadRequest("Select a Student or Teacher role.");

            // Retry if the database's unique index detects a concurrent collision.
            for (var attempt = 0; attempt < 10; attempt++)
            {
                var number = $"{DateTime.UtcNow.Year}{RandomNumberGenerator.GetInt32(100000, 1000000)}";
                if (await invites.NumberExistsAsync(number) || await users.IdNumberExistsAsync(number)) continue;

                var invite = new RegisteredId { IdNumber = number, RoleId = role.Id };
                invites.Add(invite);
                await audit.Log("INVITE_GENERATED", caller, $"Generated {role.Name} invite {number}");
                if (await uow.TrySaveUniqueAsync())
                    return ServiceResult<RegisteredIdDto>.Created(
                        new RegisteredIdDto(invite.Id, number, role.Name, false, invite.CreatedAt), $"/api/registeredid/{invite.Id}");
            }
            return Fail.Conflict("Could not generate a unique invite. Please try again.");
        }

        private static RegisteredIdDto ToDto(RegisteredId r) => new(r.Id, r.IdNumber, r.Role!.Name, r.IsUsed, r.CreatedAt);
    }
}

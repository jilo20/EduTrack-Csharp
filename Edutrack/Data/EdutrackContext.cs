using Edutrack.Models;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Data
{
    public class EduTrackContext(DbContextOptions<EduTrackContext> options): DbContext(options)
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<RegisteredId> RegisteredIds => Set<RegisteredId>();
        public DbSet<Role> Roles => Set<Role>();
    }
}

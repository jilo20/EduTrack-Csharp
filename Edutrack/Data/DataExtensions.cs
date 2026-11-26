using Edutrack.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Data
{
    public static class DataExtensions
    {
        public static void MigrateDb(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<EduTrackContext>();
            dbContext.Database.Migrate();
        }

        public static void AddEduTrackDb(this WebApplicationBuilder builder) {
            var connectionString = builder.Configuration.GetConnectionString("Edutrack");
            var admin = builder.Configuration.GetSection("DefaultAdmin");
            var seedDemo = builder.Environment.IsDevelopment() &&
                builder.Configuration.GetValue<bool>("DemoSeed:Enabled");
            void SeedDatabase(DbContext context)
            {
                Seed(context, admin);
                if (seedDemo) DemoSeeder.Seed(context);
            }
            builder.Services.AddDbContext<EduTrackContext>(options => options.UseMySql(connectionString,
                    ServerVersion.AutoDetect(connectionString))
                    .UseSeeding((context, _) => SeedDatabase(context))
                    .UseAsyncSeeding((context, _, _) => { SeedDatabase(context); return Task.CompletedTask; })
            );
        }

        // Runs on every startup (after migrations). Each step only adds what is missing, so it is safe to run again.
        private static void Seed(DbContext context, IConfigurationSection admin)
        {
            if (!context.Set<Role>().Any()) {
                context.Set<Role>().AddRange(
                    new Role { Name = "Admin" },
                    new Role { Name = "Teacher" },
                    new Role { Name = "Student" }
                );
                context.SaveChanges();
            }

            // 3.2: the default admin account, so someone can log in to a new database and create the other users.
            // Created only when there is no Admin yet. The values come from the "DefaultAdmin" settings
            // (appsettings.Development.json locally, DefaultAdmin__Password etc. environment variables in production).
            if (context.Set<User>().Any(u => u.Role!.Name == "Admin")) return;
            var email = admin["Email"]?.Trim().ToLowerInvariant();
            var password = admin["Password"];
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password) || password.Length < 8)
            {
                Console.WriteLine("WARNING: no Admin account exists and DefaultAdmin:Email / DefaultAdmin:Password (8+ characters) are not set, so none was created.");
                return;
            }
            if (context.Set<User>().Any(u => u.Email == email))
            {
                Console.WriteLine($"WARNING: DefaultAdmin:Email {email} is already used by a non-admin account, so no Admin was created.");
                return;
            }

            var user = new User
            {
                FirstName = admin["FirstName"] ?? "System",
                LastName = admin["LastName"] ?? "Admin",
                Email = email,
                IdNumber = admin["IdNumber"] ?? "0000000001",
                RoleId = context.Set<Role>().Single(r => r.Name == "Admin").Id,
                Password = "",
                Status = "active",
            };
            user.Password = new PasswordHasher<User>().HashPassword(user, password);
            context.Set<User>().Add(user);
            context.SaveChanges();
        }
    }
}

using Edutrack.Models;
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
            builder.Services.AddDbContext<EduTrackContext>(options => options.UseMySql(connectionString,
                    ServerVersion.AutoDetect(connectionString))
                    .UseSeeding((context,_) =>
                    {
                    if (!context.Set<Role>().Any()) {
                            context.Set<Role>().AddRange(
                                new Role { Name = "Admin" },
                                new Role { Name = "Teacher" },
                                new Role { Name = "Student" }
                            );
                            context.SaveChanges();    
                        } 
                    
                    })        
            );

        }
    }
}

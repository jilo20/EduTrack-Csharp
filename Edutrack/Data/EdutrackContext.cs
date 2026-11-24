using System.Text.Json;
using Edutrack.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Edutrack.Data
{
    public class EduTrackContext(DbContextOptions<EduTrackContext> options): DbContext(options)
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<RegisteredId> RegisteredIds => Set<RegisteredId>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Section> Sections => Set<Section>();
        public DbSet<Enrollment> Enrollments => Set<Enrollment>();
        public DbSet<Assessment> Assessments => Set<Assessment>();
        public DbSet<Score> Scores => Set<Score>();
        public DbSet<Attendance> Attendances => Set<Attendance>();
        public DbSet<Announcement> Announcements => Set<Announcement>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        // Every DateTime is saved in UTC (DateTime.UtcNow). MySQL does not store the time zone, so values read
        // back would have Kind = Unspecified and be sent to the browser without a "Z", which shows them 8 hours
        // early in the Philippines. Marking them as UTC on read fixes every timestamp in the API.
        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
            configurationBuilder.Properties<DateTime?>().HaveConversion<NullableUtcDateTimeConverter>();
        }

        private class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
            v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        private class NullableUtcDateTimeConverter() : ValueConverter<DateTime?, DateTime?>(
            v => v, v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

        protected override void OnModelCreating(ModelBuilder b)
        {
            // Unique keys
            b.Entity<User>().HasIndex(u => u.Email).IsUnique();
            b.Entity<User>().HasIndex(u => u.IdNumber).IsUnique();
            b.Entity<RegisteredId>().HasIndex(r => r.IdNumber).IsUnique();
            b.Entity<Enrollment>().HasIndex(e => new { e.SectionId, e.StudentId }).IsUnique();
            b.Entity<Score>().HasIndex(s => new { s.AssessmentId, s.StudentId }).IsUnique();
            b.Entity<Attendance>().HasIndex(a => new { a.StudentId, a.SectionId, a.Date }).IsUnique();

            // Users are never deleted (only deactivated), so links to them must not cascade.
            b.Entity<Section>().HasOne(s => s.Teacher).WithMany().HasForeignKey(s => s.TeacherId).OnDelete(DeleteBehavior.Restrict);
            b.Entity<Enrollment>().HasOne(e => e.Student).WithMany().HasForeignKey(e => e.StudentId).OnDelete(DeleteBehavior.Restrict);
            b.Entity<Score>().HasOne(s => s.Student).WithMany().HasForeignKey(s => s.StudentId).OnDelete(DeleteBehavior.Restrict);
            b.Entity<Attendance>().HasOne(a => a.Student).WithMany().HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.Restrict);
            b.Entity<Announcement>().HasOne(a => a.Author).WithMany().HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.SetNull);
            b.Entity<Announcement>().HasOne(a => a.Section).WithMany().HasForeignKey(a => a.SectionId).OnDelete(DeleteBehavior.SetNull);
            b.Entity<AuditLog>().HasOne(a => a.Actor).WithMany().HasForeignKey(a => a.ActorId).OnDelete(DeleteBehavior.SetNull);
            b.Entity<AuditLog>().HasIndex(a => a.Timestamp);

            // Section.Weights is stored as a JSON text column.
            b.Entity<Section>().Property(s => s.Weights)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, int>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, int>())
                .HasMaxLength(500)
                .Metadata.SetValueComparer(new ValueComparer<Dictionary<string, int>>(
                    (a, c) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(c, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null).GetHashCode(),
                    v => new Dictionary<string, int>(v)));
        }
    }
}

using Edutrack.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Data;

internal static class DemoSeeder
{
    private const string DemoPassword = "EduTrackDemo123!";

    internal static void Seed(DbContext db)
    {
        var now = DateTime.UtcNow;
        var teacherRole = db.Set<Role>().Single(r => r.Name == "Teacher").Id;
        var studentRole = db.Set<Role>().Single(r => r.Name == "Student").Id;
        User[] teachers =
        [
            Account("Kea", "Abaquita", "kea.abaquita", "9901000001", teacherRole),
            Account("Felleiandrei", "Uytico", "felleiandrei.uytico", "9901000002", teacherRole),
            Account("Angelo", "Bazar", "angelo.bazar", "9901000003", teacherRole),
        ];
        User[] students =
        [
            Account("Mary Vincent", "Lopez", "maryvincent.lopez", "9902000001", studentRole),
            Account("Nathalie", "Peter", "nathalie.peter", "9902000002", studentRole),
            Account("Mika", "Soriano", "mika.soriano", "9902000003", studentRole),
            Account("Enzo", "Villareal", "enzo.villareal", "9902000004", studentRole),
            Account("Alyssa", "Navarro", "alyssa.navarro", "9902000005", studentRole),
            Account("Lucas", "Rivera", "lucas.rivera", "9902000006", studentRole),
            Account("Sofia", "Mercado", "sofia.mercado", "9902000007", studentRole),
            Account("Diego", "Valdez", "diego.valdez", "9902000008", studentRole),
        ];
        var accounts = teachers.Concat(students).ToArray();
        var emails = accounts.Select(u => u.Email).ToArray();
        var ids = accounts.Select(u => u.IdNumber).ToArray();
        var existing = db.Set<User>()
            .Where(u => emails.Contains(u.Email) || ids.Contains(u.IdNumber))
            .ToList();
        if (existing.Count > 0)
        {
            if (accounts.All(demo => existing.Any(user =>
                    user.Email == demo.Email && user.IdNumber == demo.IdNumber && user.RoleId == demo.RoleId)))
            {
                Console.WriteLine("EduTrack demo accounts are already seeded.");
                return;
            }
            throw new InvalidOperationException("Demo seeding stopped because a demo email or ID already exists.");
        }

        (string Code, string Course, int TeacherIndex)[] classes =
        [
            ("DEMO-PROG-A", "Introduction to Programming", 0),
            ("DEMO-PROG-B", "Web Development", 0),
            ("DEMO-DATA-A", "Database Systems", 1),
            ("DEMO-DATA-B", "Data Analytics", 1),
            ("DEMO-MATH-A", "Discrete Mathematics", 2),
            ("DEMO-MATH-B", "Statistics", 2),
        ];
        (string Title, string Category, int Points)[] assessments =
        [
            ("Foundations Quiz", "Quiz", 20),
            ("Applied Skills Quiz", "Quiz", 25),
            ("Practical Project", "Project", 50),
            ("Module Exam", "Module Exam", 100),
        ];

        var hasher = new PasswordHasher<User>();
        foreach (var user in accounts)
            user.Password = hasher.HashPassword(user, DemoPassword);
        db.AddRange(accounts);

        for (var classIndex = 0; classIndex < classes.Length; classIndex++)
        {
            var (code, course, teacherIndex) = classes[classIndex];
            var section = new Section
            {
                Teacher = teachers[teacherIndex],
                CodeName = code,
                CourseProgram = course,
                Description = "Demo class for grade and performance reports.",
                CreatedAt = now.AddDays(-28),
            };
            db.Add(section);

            var roster = classIndex % 2 == 0 ? students.Take(5) : students.Skip(3);
            var enrolled = roster.ToArray();
            foreach (var student in enrolled)
                db.Add(new Enrollment { Section = section, Student = student, EnrolledAt = now.AddDays(-27) });

            for (var index = 0; index < assessments.Length; index++)
            {
                var (title, category, points) = assessments[index];
                var date = now.AddDays(-21 + index * 6);
                var assessment = new Assessment
                {
                    Section = section,
                    Title = title,
                    Type = category,
                    PerfectScore = points,
                    CreatedAt = date,
                };
                for (var studentIndex = 0; studentIndex < enrolled.Length; studentIndex++)
                {
                    var percent = 48 + studentIndex * 10 + (classIndex * 7 + index * 5) % 13;
                    assessment.Scores.Add(new Score
                    {
                        Student = enrolled[studentIndex],
                        Value = Math.Round(points * percent / 100.0, 2),
                        UpdatedAt = date.AddDays(1),
                    });
                }
                db.Add(assessment);
            }
        }

        db.SaveChanges();
        Console.WriteLine("Seeded 3 demo teachers, 8 students, 6 classes, 24 assessments, and 120 scores.");
    }

    private static User Account(string first, string last, string emailName, string id, int roleId) => new()
    {
        FirstName = first,
        LastName = last,
        Email = $"{emailName}@edutrack.test",
        IdNumber = id,
        RoleId = roleId,
        Password = "",
        Status = "active",
    };
}

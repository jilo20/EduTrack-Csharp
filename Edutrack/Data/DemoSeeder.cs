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
            Account("Celina", "Ferrer", "celina.ferrer", "9901000004", teacherRole),
            Account("Rafael", "Mendoza", "rafael.mendoza", "9901000005", teacherRole),
            Account("Isabel", "Reyes", "isabel.reyes", "9901000006", teacherRole),
        ];
        User[] students =
        [
            Account("Mary Vincent", "Lopez", "maryvincent.lopez", "9902000001", studentRole),
            Account("Nathalie", "Peter", "nathalie.peter", "9902000002", studentRole),
            Account("Kea", "Abaquita", "kea.abaquita", "9901000001", studentRole),
            Account("Felleiandrei", "Uytico", "felleiandrei.uytico", "9901000002", studentRole),
            Account("Angelo", "Bazar", "angelo.bazar", "9901000003", studentRole),
            Account("Mika", "Soriano", "mika.soriano", "9902000003", studentRole),
            Account("Enzo", "Villareal", "enzo.villareal", "9902000004", studentRole),
            Account("Alyssa", "Navarro", "alyssa.navarro", "9902000005", studentRole),
            Account("Lucas", "Rivera", "lucas.rivera", "9902000006", studentRole),
            Account("Sofia", "Mercado", "sofia.mercado", "9902000007", studentRole),
            Account("Diego", "Valdez", "diego.valdez", "9902000008", studentRole),
        ];
        var accounts = teachers.Concat(students).ToArray();
        (string PreviousCode, string Code, string Course, int TeacherIndex)[] classes =
        [
            ("DEMO-PROG-A", "CS101-A", "Programming 1", 0),
            ("DEMO-PROG-B", "CS201-A", "Data Structures and Algorithms", 0),
            ("DEMO-DATA-A", "CS220-A", "Database Systems", 1),
            ("DEMO-DATA-B", "CS310-A", "Computer Vision", 1),
            ("DEMO-MATH-A", "MATH201-A", "Discrete Mathematics", 2),
            ("DEMO-MATH-B", "STAT101-A", "Statistics", 2),
        ];
        const string previousDescription = "Demo class for grade and performance reports.";
        var emails = accounts.Select(u => u.Email).ToArray();
        var ids = accounts.Select(u => u.IdNumber).ToArray();
        var existing = db.Set<User>()
            .Where(u => emails.Contains(u.Email) || ids.Contains(u.IdNumber))
            .ToList();
        var hasher = new PasswordHasher<User>();
        if (existing.Count > 0)
        {
            // The three original teacher accounts keep their IDs as they move to the Student role.
            var formerTeachers = students.Skip(2).Take(3).ToArray();
            var formerTeacherIds = formerTeachers.Select(user => user.IdNumber).ToHashSet();
            var matches = accounts.Select(demo => existing.SingleOrDefault(user =>
                user.IdNumber == demo.IdNumber &&
                (user.RoleId == demo.RoleId || (formerTeacherIds.Contains(demo.IdNumber) && user.RoleId == teacherRole)) &&
                (user.Email == demo.Email ||
                 user.Email == $"{demo.Email.Split('@')[0]}@edutrack.test" ||
                 user.Email == $"{demo.Email.Split('@')[0]}@edutrack.com")))
                .ToArray();
            var upgrading = existing.Count == students.Length &&
                matches.Take(teachers.Length).All(user => user is null) &&
                matches.Skip(teachers.Length).All(user => user is not null);
            if (upgrading || (existing.Count == accounts.Length && matches.All(user => user is not null)))
            {
                if (upgrading)
                {
                    foreach (var teacher in teachers)
                        teacher.Password = hasher.HashPassword(teacher, DemoPassword);
                    db.AddRange(teachers);
                }
                for (var index = 0; index < matches.Length; index++)
                {
                    if (matches[index] is not { } matched) continue;
                    matched.Email = accounts[index].Email;
                    matched.RoleId = accounts[index].RoleId;
                }
                foreach (var (previousCode, code, course, teacherIndex) in classes)
                {
                    var originalAccountId = formerTeachers[teacherIndex].IdNumber;
                    var teacherId = upgrading
                        ? existing.Single(user => user.IdNumber == originalAccountId).Id
                        : matches[teacherIndex]!.Id;
                    var section = db.Set<Section>().SingleOrDefault(s =>
                        s.TeacherId == teacherId &&
                        ((s.CodeName == previousCode && s.Description == previousDescription) ||
                         (s.CodeName == code && s.CourseProgram == course)));
                    if (section is null) continue;
                    if (upgrading) section.Teacher = teachers[teacherIndex];
                    if (section.CodeName == previousCode)
                    {
                        section.CodeName = code;
                        section.CourseProgram = course;
                        section.Description = null;
                    }
                    var enrolled = db.Set<Enrollment>().Where(e => e.SectionId == section.Id)
                        .OrderBy(e => e.Student!.IdNumber).Select(e => e.Student!).ToArray();
                    SeedAttendance(db, section, enrolled);
                }
                db.SaveChanges();
                Console.WriteLine("EduTrack accounts are already seeded.");
                return;
            }
            throw new InvalidOperationException("Demo seeding stopped because a demo email or ID already exists.");
        }

        (string Title, string Category, int Points)[] assessments =
        [
            ("Foundations Quiz", "Quiz", 20),
            ("Applied Skills Quiz", "Quiz", 25),
            ("Practical Project", "Project", 50),
            ("Module Exam", "Module Exam", 100),
        ];

        foreach (var user in accounts)
            user.Password = hasher.HashPassword(user, DemoPassword);
        db.AddRange(accounts);

        for (var classIndex = 0; classIndex < classes.Length; classIndex++)
        {
            var (_, code, course, teacherIndex) = classes[classIndex];
            var section = new Section
            {
                Teacher = teachers[teacherIndex],
                CodeName = code,
                CourseProgram = course,
                CreatedAt = now.AddDays(-28),
            };
            db.Add(section);

            var roster = classIndex % 2 == 0 ? students.Take(6) : students.Skip(5);
            var enrolled = roster.ToArray();
            foreach (var student in enrolled)
                db.Add(new Enrollment { Section = section, Student = student, EnrolledAt = now.AddDays(-27) });
            SeedAttendance(db, section, enrolled);

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
        Console.WriteLine("Seeded 3 teachers, 11 students, 6 classes, 24 assessments, 144 scores, and attendance.");
    }

    private static void SeedAttendance(DbContext db, Section section, User[] students)
    {
        const int sessionCount = 6;
        var firstDate = DateOnly.FromDateTime(section.CreatedAt.AddDays(3));
        var lastDate = firstDate.AddDays((sessionCount - 1) * 3);
        var existing = new HashSet<(int StudentId, DateOnly Date)>();
        if (section.Id != 0)
        {
            foreach (var row in db.Set<Attendance>()
                .Where(a => a.SectionId == section.Id && a.Date >= firstDate && a.Date <= lastDate)
                .Select(a => new { a.StudentId, a.Date }))
                existing.Add((row.StudentId, row.Date));
        }

        foreach (var student in students.OrderBy(u => u.IdNumber))
        {
            var studentNumber = student.IdNumber.Sum(character => (int)character);
            for (var session = 0; session < sessionCount; session++)
            {
                var date = firstDate.AddDays(session * 3);
                if (existing.Contains((student.Id, date))) continue;
                var status = ((studentNumber + session * 3) % 11) switch
                {
                    0 or 1 => Attendance.Absent,
                    2 or 3 => Attendance.Late,
                    _ => Attendance.Present,
                };
                db.Add(new Attendance { Section = section, Student = student, Date = date, Status = status });
            }
        }
    }

    private static User Account(string first, string last, string emailName, string id, int roleId) => new()
    {
        FirstName = first,
        LastName = last,
        Email = $"{emailName}@gmail.com",
        IdNumber = id,
        RoleId = roleId,
        Password = "",
        Status = "active",
    };
}

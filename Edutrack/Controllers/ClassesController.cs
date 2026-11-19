// ============================================================================
// FILE:    Controllers/ClassesController.cs
// OWNER:   Bazar, Angelo
// WBS:     7.1 Create Class API, 7.2 My Classes / All Classes API, 7.3 Enrollment & Roster API
// PURPOSE: Classes (sections), enrollment, and roster.
//
// ENDPOINTS TO BUILD (Teacher / Admin):
//   GET  /api/classes?teacherId=   -> ClassDto[]  (teacher: own classes; admin: all classes)
//   POST /api/classes              body: CreateClassDto -> ClassDto
//   GET  /api/classes/{id}/roster  -> RosterDto (students + their scores)
//   POST /api/classes/{id}/enroll  body: EnrollStudentsDto
// RULES:
//   - A teacher can only create and open their own classes. An admin can do it for any teacher.
//   - A student cannot be enrolled twice in the same class.
//   - Notify the teacher when a student is enrolled (NotificationService).
//
// ============================================================================

using Edutrack.Data;
using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Controllers
{
    [ApiController]
    [Route("/api/classes")]
    [Authorize(Roles = "Admin,Teacher")]
    public class ClassesController(EduTrackContext db, NotificationService notifications, AuditLogService audit) : ControllerBase
    {
        // 7.2 My Classes (teacher) / All Classes (admin, optionally ?teacherId=)
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? teacherId)
        {
            var query = db.Sections.Include(s => s.Teacher).AsQueryable();
            if (!User.IsAdmin())
            {
                if (teacherId is not null && teacherId != User.UserId())
                    return StatusCode(StatusCodes.Status403Forbidden, new { error = "Teachers can only see their own classes." });
                query = query.Where(s => s.TeacherId == User.UserId());
            }
            else if (teacherId is not null)
                query = query.Where(s => s.TeacherId == teacherId);

            var rows = await query.OrderBy(s => s.Status == "completed").ThenByDescending(s => s.CreatedAt)
                .Select(s => new { Section = s, Count = db.Enrollments.Count(e => e.SectionId == s.Id) })
                .ToListAsync();
            return Ok(rows.Select(r => ClassDto.From(r.Section, r.Count)));
        }

        // 7.1 Create Class
        [HttpPost]
        public async Task<IActionResult> Create(CreateClassDto dto)
        {
            int teacherId;
            if (User.IsAdmin())
            {
                if (dto.TeacherId is null) return BadRequest(new { error = "Choose the teacher for this class." });
                teacherId = dto.TeacherId.Value;
            }
            else
            {
                if (dto.TeacherId is not null && dto.TeacherId != User.UserId())
                    return StatusCode(StatusCodes.Status403Forbidden, new { error = "Teachers can only create their own classes." });
                teacherId = User.UserId();
            }

            var teacher = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == teacherId);
            if (teacher is null || teacher.Role!.Name != "Teacher" || teacher.Status != "active")
                return BadRequest(new { error = "The teacher must be an active teacher account." });

            var weights = (dto.Weights is { Count: > 0 } ? dto.Weights : Section.DefaultWeights())
                .ToDictionary(w => w.Key.Trim(), w => w.Value);
            var weightError = CheckWeights(weights);
            if (weightError is not null) return BadRequest(new { error = weightError });

            var section = new Section
            {
                TeacherId = teacher.Id,
                Teacher = teacher,
                CourseProgram = dto.Name.Trim(),
                CodeName = dto.SectionCode.Trim(),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                Schedule = string.IsNullOrWhiteSpace(dto.Schedule) ? "TBA" : dto.Schedule.Trim(),
                PassingGrade = dto.PassingGrade,
                Weights = weights,
            };
            db.Sections.Add(section);
            await audit.Log("CLASS_CREATED", User, $"Created class {section.CourseProgram} ({section.CodeName}) for {teacher.FirstName} {teacher.LastName}");
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Roster), new { id = section.Id }, ClassDto.From(section, 0));
        }

        // 7.3 Roster: the class's assessments plus each student and their scores.
        [HttpGet("{id:int}/roster")]
        public async Task<IActionResult> Roster(int id)
        {
            var section = await db.Sections.FindAsync(id);
            if (section is null) return NotFound(new { error = "Class not found." });
            if (!User.CanManage(section)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "This is not your class." });

            var assessments = await db.Assessments.Where(a => a.SectionId == id).OrderBy(a => a.CreatedAt).ToListAsync();
            var scores = await db.Scores.Where(s => s.Assessment!.SectionId == id).ToListAsync();
            var students = await db.Enrollments.Where(e => e.SectionId == id).Select(e => e.Student!)
                .OrderBy(s => s.LastName).ThenBy(s => s.FirstName).ToListAsync();

            return Ok(new RosterDto(section.Id, section.CourseProgram, section.CodeName,
                assessments.Select(a => new AssessmentDto(a.Id, a.SectionId, a.Title, a.Type, a.PerfectScore)).ToList(),
                students.Select(s => new RosterStudentDto(s.Id, $"{s.FirstName} {s.LastName}", s.Email, s.IdNumber,
                    scores.Where(x => x.StudentId == s.Id).ToDictionary(x => x.AssessmentId, x => x.Value))).ToList()));
        }

        // 7.3 Enrollment. Students already in the class are skipped, never enrolled twice.
        [HttpPost("{id:int}/enroll")]
        public async Task<IActionResult> Enroll(int id, EnrollStudentsDto dto)
        {
            var section = await db.Sections.FindAsync(id);
            if (section is null) return NotFound(new { error = "Class not found." });
            if (!User.CanManage(section)) return StatusCode(StatusCodes.Status403Forbidden, new { error = "This is not your class." });
            if (section.Status == "completed") return BadRequest(new { error = "This class has ended. Students can no longer be enrolled." });

            var ids = dto.StudentIds.Distinct().ToList();
            var students = await db.Users.Where(u => ids.Contains(u.Id) && u.Role!.Name == "Student" && u.Status == "active").ToListAsync();
            var invalid = ids.Except(students.Select(s => s.Id)).ToList();
            if (invalid.Count > 0)
                return BadRequest(new { error = $"These ids are not active students: {string.Join(", ", invalid)}." });

            var already = await db.Enrollments.Where(e => e.SectionId == id && ids.Contains(e.StudentId)).Select(e => e.StudentId).ToListAsync();
            var added = students.Where(s => !already.Contains(s.Id)).ToList();
            db.Enrollments.AddRange(added.Select(s => new Enrollment { SectionId = id, StudentId = s.Id }));

            if (added.Count > 0)
            {
                if (section.TeacherId != User.UserId())
                    notifications.Notify(section.TeacherId, "Students enrolled",
                        $"{added.Count} student(s) were enrolled in {section.CourseProgram} ({section.CodeName}).");
                notifications.NotifyMany(added.Select(s => s.Id), "New class",
                    $"You were enrolled in {section.CourseProgram} ({section.CodeName}).");
            }
            await db.SaveChangesAsync();
            return Ok(new { classId = id, enrolled = added.Count, alreadyEnrolled = already.Count });
        }

        // Weights must be 0-100 each, total 100, and have 1-10 named categories.
        public static string? CheckWeights(Dictionary<string, int> weights)
        {
            if (weights.Count is 0 or > 10) return "Use between 1 and 10 grading categories.";
            if (weights.Keys.Any(k => k.Length is 0 or > 50)) return "Each category needs a name of up to 50 characters.";
            if (weights.Values.Any(v => v is < 0 or > 100)) return "Each weight must be between 0 and 100.";
            if (weights.Values.Sum() != 100) return $"The weights must total 100% (now {weights.Values.Sum()}%).";
            return null;
        }
    }
}

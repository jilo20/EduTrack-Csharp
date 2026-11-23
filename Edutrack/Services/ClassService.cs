// ============================================================================
// FILE:    Services/ClassService.cs
// OWNER:   Bazar, Angelo (7.1 - 7.3), Lopez, Mary Vincent (7.4 weights)
// WBS:     7.1 Create Class, 7.2 My Classes / All Classes, 7.3 Enrollment & Roster, 7.4 Grading Weights
// PURPOSE: All class rules: who may see / create / manage a class, weight validation, enrollment.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class ClassService(
        IClassRepository classes,
        IAssessmentRepository assessments,
        IUserRepository users,
        IUnitOfWork uow,
        NotificationService notifications,
        AuditLogService audit)
    {
        // 7.2 My Classes (teacher) / All Classes (admin, optionally filtered by teacher)
        public async Task<ServiceResult<List<ClassDto>>> ListAsync(int? teacherId, Caller caller)
        {
            if (!caller.IsAdmin)
            {
                if (teacherId is not null && teacherId != caller.Id)
                    return Fail.Forbidden("Teachers can only see their own classes.");
                teacherId = caller.Id;
            }
            var rows = await classes.ListWithStudentCountsAsync(teacherId);
            return rows.Select(r => ClassDto.From(r.Section, r.StudentCount)).ToList();
        }

        // 7.1 Create Class
        public async Task<ServiceResult<ClassDto>> CreateAsync(CreateClassDto dto, Caller caller)
        {
            int teacherId;
            if (caller.IsAdmin)
            {
                if (dto.TeacherId is null) return Fail.BadRequest("Choose the teacher for this class.");
                teacherId = dto.TeacherId.Value;
            }
            else
            {
                if (dto.TeacherId is not null && dto.TeacherId != caller.Id)
                    return Fail.Forbidden("Teachers can only create their own classes.");
                teacherId = caller.Id;
            }

            var teacher = await users.GetByIdAsync(teacherId);
            if (teacher is null || teacher.Role!.Name != "Teacher" || teacher.Status != "active")
                return Fail.BadRequest("The teacher must be an active teacher account.");

            var rawWeights = dto.Weights is { Count: > 0 } ? dto.Weights : Section.DefaultWeights();
            // "Quiz" and " quiz " are the same category once trimmed; reject instead of crashing.
            if (rawWeights.Keys.Select(k => k.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != rawWeights.Count)
                return Fail.BadRequest("Category names must be unique.");
            var weights = rawWeights.ToDictionary(w => w.Key.Trim(), w => w.Value);
            var weightError = CheckWeights(weights);
            if (weightError is not null) return Fail.BadRequest(weightError);

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
            classes.Add(section);
            await audit.Log("CLASS_CREATED", caller, $"Created class {section.CourseProgram} ({section.CodeName}) for {teacher.FirstName} {teacher.LastName}");
            await uow.SaveChangesAsync();
            return ServiceResult<ClassDto>.Created(ClassDto.From(section, 0), $"/api/classes/{section.Id}/roster");
        }

        // 7.3 Roster: the class's assessments plus each student and their scores.
        public async Task<ServiceResult<RosterDto>> RosterAsync(int id, Caller caller)
        {
            var section = await classes.GetByIdAsync(id);
            if (section is null) return Fail.NotFound("Class not found.");
            if (!caller.CanManage(section)) return Fail.Forbidden("This is not your class.");

            var classAssessments = await assessments.ListBySectionAsync(id);
            var scores = await assessments.GetScoresBySectionAsync(id);
            var students = await classes.GetStudentsAsync(id);

            return new RosterDto(section.Id, section.CourseProgram, section.CodeName,
                classAssessments.Select(a => new AssessmentDto(a.Id, a.SectionId, a.Title, a.Type, a.PerfectScore)).ToList(),
                students.Select(s => new RosterStudentDto(s.Id, $"{s.FirstName} {s.LastName}", s.Email, s.IdNumber,
                    scores.Where(x => x.StudentId == s.Id).ToDictionary(x => x.AssessmentId, x => x.Value))).ToList());
        }

        // 7.3 Enrollment. Students already in the class are skipped, never enrolled twice.
        public async Task<ServiceResult<EnrollResultDto>> EnrollAsync(int id, EnrollStudentsDto dto, Caller caller)
        {
            var section = await classes.GetByIdAsync(id);
            if (section is null) return Fail.NotFound("Class not found.");
            if (!caller.CanManage(section)) return Fail.Forbidden("This is not your class.");
            if (section.Status == "completed") return Fail.BadRequest("This class has ended. Students can no longer be enrolled.");

            var ids = dto.StudentIds.Distinct().ToList();
            var students = await users.GetActiveStudentsAsync(ids);
            var invalid = ids.Except(students.Select(s => s.Id)).ToList();
            if (invalid.Count > 0)
                return Fail.BadRequest($"These ids are not active students: {string.Join(", ", invalid)}.");

            var already = await classes.GetEnrolledStudentIdsAsync(id, ids);
            var added = students.Where(s => !already.Contains(s.Id)).ToList();
            classes.AddEnrollments(id, added.Select(s => s.Id));

            if (added.Count > 0)
            {
                if (section.TeacherId != caller.Id)
                    notifications.Notify(section.TeacherId, "Students enrolled",
                        $"{added.Count} student(s) were enrolled in {section.CourseProgram} ({section.CodeName}).");
                notifications.NotifyMany(added.Select(s => s.Id), "New class",
                    $"You were enrolled in {section.CourseProgram} ({section.CodeName}).");
            }
            await uow.SaveChangesAsync();
            return new EnrollResultDto(id, added.Count, already.Count);
        }

        // 7.4 Grading weights. The input (names, 0-100, total 100) is validated by UpdateWeightsDto first.
        public async Task<ServiceResult<WeightsResultDto>> UpdateWeightsAsync(int id, Dictionary<string, int> weights, Caller caller)
        {
            var section = await classes.GetByIdAsync(id);
            if (section is null) return Fail.NotFound("Class not found.");
            if (!caller.CanManage(section)) return Fail.Forbidden("This is not your class.");
            if (section.Status == "completed") return Fail.BadRequest("This class has ended. Grading weights are final.");

            section.Weights = new Dictionary<string, int>(weights);
            await uow.SaveChangesAsync();
            return new WeightsResultDto(id, section.Weights);
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

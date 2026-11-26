// ============================================================================
// FILE:    Services/StudentService.cs
// OWNER:   Lopez, Mary Vincent
// WBS:     10.1 Student Dashboard, 10.2 Performance, 10.3 Assessments List
// PURPOSE: What a student sees about themself. All queries are scoped to that student,
//          without loading classmates' records.
// ============================================================================

using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    public class StudentService(
        IUserRepository users,
        IClassRepository classes,
        IAssessmentRepository assessments,
        IAttendanceRepository attendance)
    {
        private record ClassResult(Section Section, double? Grade, double? Point, List<CategoryResultDto> Categories);

        public async Task<ServiceResult<StudentDashboardDto>> DashboardAsync(int id, Caller caller)
        {
            if (await CheckAccess(id, caller) is { } error) return error;
            var results = await Results(id);
            var sectionIds = results.Select(r => r.Section.Id).ToList();
            var graded = results.Where(r => r.Grade.HasValue).ToList();
            var latest = (await assessments.GetLatestStudentScoresAsync(id, sectionIds, 5))
                .Select(s => new StudentLatestScoreDto(s.Assessment!.Title, s.Assessment.Section!.CourseProgram, s.Value, s.Assessment.PerfectScore))
                .ToList();
            var statuses = await attendance.GetStudentStatusesAsync(id, sectionIds);
            return new StudentDashboardDto(
                graded.Count == 0 ? null : Math.Round(graded.Average(r => r.Grade!.Value), 2),
                graded.Count == 0 ? null : Math.Round(graded.Average(r => r.Point!.Value), 2),
                GradeService.AttendanceRate(statuses),
                results.Select(r => new StudentDashboardClassDto(r.Section.Id, r.Section.CourseProgram, r.Section.CodeName,
                    r.Section.Teacher is null ? "" : $"{r.Section.Teacher.FirstName} {r.Section.Teacher.LastName}", r.Grade)).ToList(),
                latest);
        }

        public async Task<ServiceResult<List<PerformanceDto>>> PerformanceAsync(int id, Caller caller)
        {
            if (await CheckAccess(id, caller) is { } error) return error;
            return (await Results(id)).Select(r => new PerformanceDto(r.Section.Id, r.Section.CourseProgram,
                r.Grade, r.Point, r.Point is double point ? GradeService.Describe(point) : null, r.Categories)).ToList();
        }

        public async Task<ServiceResult<List<StudentAssessmentDto>>> AssessmentsAsync(int id, Caller caller)
        {
            if (await CheckAccess(id, caller) is { } error) return error;
            var sectionIds = await classes.GetSectionIdsForStudentAsync(id);
            var list = await assessments.ListForSectionsAsync(sectionIds);
            var scores = (await assessments.GetStudentScoresInSectionsAsync(id, sectionIds)).ToDictionary(s => s.AssessmentId);
            return list.Select(a =>
            {
                var score = scores.GetValueOrDefault(a.Id);
                return new StudentAssessmentDto(a.Id, a.Section!.CourseProgram, a.Title, a.Type,
                    score?.Value, a.PerfectScore, score is null ? "Pending" : "Graded");
            }).ToList();
        }

        // A student sees only their own records; an admin sees any student's.
        private async Task<ServiceError?> CheckAccess(int id, Caller caller)
        {
            if (!caller.IsSelfOrAdmin(id)) return Fail.Forbidden("You can only view your own records.");
            if (!await users.IsStudentAsync(id)) return Fail.NotFound("Student not found.");
            return null;
        }

        private async Task<List<ClassResult>> Results(int id)
        {
            var sections = await classes.ListForStudentWithTeacherAsync(id);
            var sectionIds = sections.Select(s => s.Id).ToList();
            var scores = await assessments.GetStudentScoresInSectionsAsync(id, sectionIds);
            return sections.Select(section =>
            {
                var values = scores.Where(s => s.Assessment!.SectionId == section.Id)
                    .Select(s => (s.Assessment!.Type, s.Value, s.Assessment.PerfectScore)).ToList();
                var grade = GradeService.ClassGrade(values, section.Weights);
                double? point = grade is double g ? GradeService.ToGradePoint(g, section.PassingGrade) : null;
                var averages = GradeService.CategoryAverages(values);
                var categories = section.Weights.Select(w => new CategoryResultDto(
                    w.Key, averages.TryGetValue(w.Key, out var average) ? average : null, w.Value)).ToList();
                return new ClassResult(section, grade, point, categories);
            }).ToList();
        }
    }
}

// OWNER: Lopez, Mary Vincent — WBS 10.1 Dashboard, 10.2 Performance, 10.3 Assessments
using Edutrack.Data;
using Edutrack.Dtos;
using Edutrack.Models;
using Edutrack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Controllers;

[ApiController]
[Authorize(Roles = "Student,Admin")]
[Route("/api/students/{id:int}")]
public class StudentsController(EduTrackContext db) : ControllerBase
{
    private bool CanView(int id) => User.IsAdmin() || User.UserId() == id;
    private Task<bool> StudentExists(int id) => db.Users.AnyAsync(u => u.Id == id && u.Role!.Name == "Student");

    private async Task<List<Section>> Sections(int id) => await db.Sections.AsNoTracking()
        .Where(s => db.Enrollments.Any(e => e.StudentId == id && e.SectionId == s.Id)).Include(s => s.Teacher)
        .OrderBy(s => s.CourseProgram).ThenBy(s => s.Id).ToListAsync();

    // All queries are scoped to this student, without loading classmates' records.
    private async Task<List<(Section Section, double? Grade, double? Point, List<CategoryResultDto> Categories)>> Results(int id)
    {
        var sections = await Sections(id);
        var sectionIds = sections.Select(s => s.Id).ToList();
        var scores = await db.Scores.AsNoTracking().Include(s => s.Assessment)
            .Where(s => s.StudentId == id && sectionIds.Contains(s.Assessment!.SectionId)).ToListAsync();
        return sections.Select(section =>
        {
            var values = scores.Where(s => s.Assessment!.SectionId == section.Id)
                .Select(s => (s.Assessment!.Type, s.Value, s.Assessment.PerfectScore)).ToList();
            var grade = GradeService.ClassGrade(values, section.Weights);
            double? point = grade is double g ? GradeService.ToGradePoint(g, section.PassingGrade) : null;
            var averages = GradeService.CategoryAverages(values);
            var categories = section.Weights.Select(w => new CategoryResultDto(
                w.Key, averages.TryGetValue(w.Key, out var average) ? average : null, w.Value)).ToList();
            return (section, grade, point, categories);
        }).ToList();
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(int id)
    {
        if (!CanView(id)) return Forbid();
        if (!await StudentExists(id)) return NotFound(new { error = "Student not found." });
        var results = await Results(id);
        var sectionIds = results.Select(r => r.Section.Id).ToList();
        var graded = results.Where(r => r.Grade.HasValue).ToList();
        var latest = await db.Scores.AsNoTracking()
            .Where(s => s.StudentId == id && sectionIds.Contains(s.Assessment!.SectionId))
            .OrderByDescending(s => s.UpdatedAt).ThenByDescending(s => s.Id).Take(5)
            .Select(s => new StudentLatestScoreDto(s.Assessment!.Title, s.Assessment.Section!.CourseProgram,
                s.Value, s.Assessment.PerfectScore)).ToListAsync();
        var statuses = await db.Attendances.AsNoTracking().Where(a => a.StudentId == id && sectionIds.Contains(a.SectionId))
            .Select(a => a.Status).ToListAsync();
        return Ok(new StudentDashboardDto(
            graded.Count == 0 ? null : Math.Round(graded.Average(r => r.Grade!.Value), 2),
            graded.Count == 0 ? null : Math.Round(graded.Average(r => r.Point!.Value), 2),
            GradeService.AttendanceRate(statuses),
            results.Select(r => new StudentDashboardClassDto(r.Section.Id, r.Section.CourseProgram, r.Section.CodeName,
                r.Section.Teacher is null ? "" : $"{r.Section.Teacher.FirstName} {r.Section.Teacher.LastName}", r.Grade)).ToList(),
            latest));
    }

    [HttpGet("performance")]
    public async Task<IActionResult> Performance(int id)
    {
        if (!CanView(id)) return Forbid();
        if (!await StudentExists(id)) return NotFound(new { error = "Student not found." });
        return Ok((await Results(id)).Select(r => new PerformanceDto(r.Section.Id, r.Section.CourseProgram,
            r.Grade, r.Point, r.Point is double point ? GradeService.Describe(point) : null, r.Categories)));
    }

    [HttpGet("assessments")]
    public async Task<IActionResult> Assessments(int id)
    {
        if (!CanView(id)) return Forbid();
        if (!await StudentExists(id)) return NotFound(new { error = "Student not found." });
        var sectionIds = db.Enrollments.Where(e => e.StudentId == id).Select(e => e.SectionId);
        var assessments = await db.Assessments.AsNoTracking().Where(a => sectionIds.Contains(a.SectionId))
            .Include(a => a.Section).OrderByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id).ToListAsync();
        var scores = await db.Scores.AsNoTracking()
            .Where(s => s.StudentId == id && sectionIds.Contains(s.Assessment!.SectionId))
            .ToDictionaryAsync(s => s.AssessmentId);
        return Ok(assessments.Select(a =>
        {
            var score = scores.GetValueOrDefault(a.Id);
            return new StudentAssessmentDto(a.Id, a.Section!.CourseProgram, a.Title, a.Type,
                score?.Value, a.PerfectScore, score is null ? "Pending" : "Graded");
        }));
    }
}

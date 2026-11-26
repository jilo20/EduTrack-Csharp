// ============================================================================
// FILE:    Services/GradeService.cs
// OWNER:   Bazar, Angelo
// WBS:     8.3 Grade Computation
// PURPOSE: All grade math lives here so every controller gets the same numbers.
//
// TO BUILD:
//   - ComputeClassGrade(studentId, classId):
//       category average = average of (score / perfect score) in that category
//       class grade %    = sum of (category average x category weight)
//   - ToGradePoint(percentage, passingGrade): convert to the 1.00 - 5.00 scale
//       below passing = 5.00, 100% = 1.00, in between = 1.0 + 2.0 x (100 - %) / (100 - passingGrade)
//   - ComputeGwa(studentId): average of the student's class grades
//   - AttendanceRate = (Present + Late x 0.5) / days, ignoring "No Class" days
// NOTE: default weights are Quiz 30%, Project 30%, Module Exam 40%; default passing grade is 60.
//
// ============================================================================

using Edutrack.Models;
using Edutrack.Repositories;

namespace Edutrack.Services
{
    // One student's result in one class.
    public record StudentResult(User Student, double? Grade, double? GradePoint, double? AttendanceRate,
        List<(Assessment Assessment, Score? Score)> Scores, List<Attendance> Attendance);

    public class GradeService(IClassRepository classes, IAssessmentRepository assessments, IAttendanceRepository attendanceRecords)
    {
        // ---- Pure math (no database) ----

        // Category average = average of (score / perfect) in that category. Class grade = sum of (category average x weight).
        // Only graded scores count ("pending is not counted"). If a category has no scores yet, it is left out
        // and the other weights are scaled up so the grade is still out of 100.
        public static double? ClassGrade(IEnumerable<(string Type, double Score, int Perfect)> scores, IReadOnlyDictionary<string, int> weights)
        {
            var averages = CategoryAverages(scores);
            double total = 0, usedWeight = 0;
            foreach (var (type, weight) in weights)
            {
                if (!averages.TryGetValue(type, out var avg)) continue;
                total += avg * weight;
                usedWeight += weight;
            }
            return usedWeight == 0 ? null : Math.Round(total / usedWeight, 2);
        }

        // Category -> average % (0 - 100).
        public static Dictionary<string, double> CategoryAverages(IEnumerable<(string Type, double Score, int Perfect)> scores) =>
            scores.GroupBy(s => s.Type)
                  .ToDictionary(g => g.Key, g => Math.Round(g.Average(s => s.Score / s.Perfect * 100), 2));

        // 1.00 - 5.00 scale. Below passing = 5.00, 100% = 1.00, in between = 1.0 + 2.0 x (100 - %) / (100 - passing).
        public static double ToGradePoint(double percentage, int passingGrade)
        {
            if (percentage < passingGrade) return 5.0;
            if (passingGrade >= 100) return 1.0;
            return Math.Round(1.0 + 2.0 * (100 - Math.Min(percentage, 100)) / (100 - passingGrade), 2);
        }

        // Words for a grade point, used in reports and the admin performance chart.
        public static string Describe(double gradePoint) => gradePoint switch
        {
            <= 1.5 => "Excellent",
            <= 2.0 => "Very Good",
            <= 2.5 => "Good",
            <= 3.0 => "Passing",
            _ => "Failed",
        };

        // (Present + Late x 0.5) / days, ignoring "No Class" days. Null when there are no days yet.
        public static double? AttendanceRate(IEnumerable<string> statuses)
        {
            var days = statuses.Where(s => s != Attendance.NoClass).ToList();
            if (days.Count == 0) return null;
            var points = days.Count(s => s == Attendance.Present) + days.Count(s => s == Attendance.Late) * 0.5;
            return Math.Round(points / days.Count * 100, 2);
        }

        // ---- With data from the repositories ----

        // Every enrolled student's grade, grade point, and attendance in one class.
        public async Task<List<StudentResult>> ClassResults(Section section)
        {
            var students = await classes.GetStudentsAsync(section.Id);
            var classAssessments = await assessments.ListBySectionWithScoresAsync(section.Id);
            var attendance = await attendanceRecords.ListBySectionAsync(section.Id);

            return students.Select(st =>
            {
                var scores = classAssessments.Select(a => (Assessment: a, Score: a.Scores.FirstOrDefault(s => s.StudentId == st.Id))).ToList();
                var graded = scores.Where(x => x.Score is not null).Select(x => (x.Assessment.Type, x.Score!.Value, x.Assessment.PerfectScore));
                var grade = ClassGrade(graded, section.Weights);
                var days = attendance.Where(a => a.StudentId == st.Id).OrderBy(a => a.Date).ToList();
                return new StudentResult(st, grade, grade is null ? null : ToGradePoint(grade.Value, section.PassingGrade),
                    AttendanceRate(days.Select(d => d.Status)), scores, days);
            }).ToList();
        }
    }
}

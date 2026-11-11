/*
 * MOCK DATA: dashboards and charts
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
export const mockAdminAnalytics = {
  totals: { students: 124, teachers: 9, classes: 14, activeUsers: 128 },
  enrollmentPerClass: [
    { name: 'IT301-A', students: 32 },
    { name: 'IT302-B', students: 28 },
    { name: 'IT201-A', students: 35 },
    { name: 'IT202-C', students: 29 },
  ],
  performance: [
    { name: 'Excellent', count: 18 },
    { name: 'Very Good', count: 41 },
    { name: 'Good', count: 37 },
    { name: 'Passing', count: 19 },
    { name: 'Failed', count: 9 },
  ],
  attendance: { present: 86, late: 6, absent: 8 },
};

export const mockTeacherAnalytics = {
  totals: { classes: 2, students: 60, assessments: 11 },
  classes: [
    { classId: 1, name: 'IT301-A', average: 79, passingRate: 88, attendanceRate: 91 },
    { classId: 2, name: 'IT302-B', average: 84, passingRate: 93, attendanceRate: 95 },
  ],
};

export const mockStudentAnalytics = {
  trend: [
    { name: 'Quiz 1', score: 90 },
    { name: 'Midterm Project', score: 88 },
    { name: 'Module Exam 1', score: 82 },
    { name: 'Quiz 2', score: 95 },
  ],
  byCategory: [
    { type: 'Quiz', average: 92 },
    { type: 'Project', average: 89 },
    { type: 'Module Exam', average: 84 },
  ],
};

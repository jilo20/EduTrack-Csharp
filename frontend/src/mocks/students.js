/*
 * MOCK DATA: the student portal
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
export const mockStudentDashboard = {
  gwa: 88,
  equivalentGrade: 1.6,
  attendanceRate: 89,
  classes: [
    { id: 1, name: 'BSIT 3 - Web Development', sectionCode: 'IT301-A', teacher: 'Maria Santos', grade: 86 },
    { id: 2, name: 'BSIT 3 - Database Systems', sectionCode: 'IT302-B', teacher: 'Maria Santos', grade: 90 },
  ],
  latestScores: [
    { assessment: 'Module Exam 1', className: 'BSIT 3 - Web Development', score: 41, perfectScore: 50 },
    { assessment: 'Quiz 2', className: 'BSIT 3 - Database Systems', score: 19, perfectScore: 20 },
  ],
};

export const mockPerformance = [
  {
    classId: 1, className: 'BSIT 3 - Web Development', grade: 86, equivalentGrade: 1.7, description: 'Very Good',
    categories: [
      { type: 'Quiz', average: 90, weight: 30 },
      { type: 'Project', average: 88, weight: 30 },
      { type: 'Module Exam', average: 82, weight: 40 },
    ],
  },
  {
    classId: 2, className: 'BSIT 3 - Database Systems', grade: 90, equivalentGrade: 1.5, description: 'Very Good',
    categories: [
      { type: 'Quiz', average: 95, weight: 30 },
      { type: 'Project', average: 90, weight: 30 },
      { type: 'Module Exam', average: 86, weight: 40 },
    ],
  },
];

// status: Graded (has a score) or Pending (no score yet)
export const mockStudentAssessments = [
  { id: 1, className: 'BSIT 3 - Web Development', title: 'Quiz 1', type: 'Quiz', score: 18, perfectScore: 20, status: 'Graded' },
  { id: 2, className: 'BSIT 3 - Web Development', title: 'Midterm Project', type: 'Project', score: 88, perfectScore: 100, status: 'Graded' },
  { id: 3, className: 'BSIT 3 - Web Development', title: 'Module Exam 1', type: 'Module Exam', score: 41, perfectScore: 50, status: 'Graded' },
  { id: 4, className: 'BSIT 3 - Database Systems', title: 'ERD Project', type: 'Project', score: null, perfectScore: 100, status: 'Pending' },
];

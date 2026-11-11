/*
 * MOCK DATA: class and student reports
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
export const mockClassReport = {
  className: 'BSIT 3 - Web Development',
  sectionCode: 'IT301-A',
  totalStudents: 3,
  classAverage: 79,
  classAverageEquiv: 2.05,
  attendanceRate: 91,
  passingCount: 2,
  students: [
    { id: 4, name: 'Ana Reyes', email: 'ana.reyes@edutrack.com', grade: 96, equivalentGrade: 1.2, attendanceRate: 100 },
    { id: 3, name: 'Juan Dela Cruz', email: 'juan.delacruz@edutrack.com', grade: 86, equivalentGrade: 1.7, attendanceRate: 94 },
    { id: 5, name: 'Carlo Mendoza', email: 'carlo.mendoza@edutrack.com', grade: 54, equivalentGrade: 5.0, attendanceRate: 78 },
  ],
};

export const mockStudentReport = {
  student: { id: 3, name: 'Juan Dela Cruz' },
  grade: 86,
  equivalentGrade: 1.7,
  description: 'Very Good',
  scores: [
    { assessment: 'Quiz 1', type: 'Quiz', score: 18, perfectScore: 20 },
    { assessment: 'Midterm Project', type: 'Project', score: 88, perfectScore: 100 },
    { assessment: 'Module Exam 1', type: 'Module Exam', score: 41, perfectScore: 50 },
  ],
  categories: [
    { type: 'Quiz', average: 90, weight: 30 },
    { type: 'Project', average: 88, weight: 30 },
    { type: 'Module Exam', average: 82, weight: 40 },
  ],
  attendance: { present: 15, late: 2, absent: 1, rate: 89 },
};

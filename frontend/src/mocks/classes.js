/*
 * MOCK DATA: classes and roster
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
const weights = { Quiz: 30, Project: 30, 'Module Exam': 40 };

export const mockClasses = [
  { id: 1, name: 'BSIT 3 - Web Development', sectionCode: 'IT301-A', teacherId: 2, teacher: 'Maria Santos', schedule: 'MWF 9:00 - 10:30', description: 'React and REST APIs', status: 'active', studentCount: 3, passingGrade: 60, weights },
  { id: 2, name: 'BSIT 3 - Database Systems', sectionCode: 'IT302-B', teacherId: 2, teacher: 'Maria Santos', schedule: 'TTh 13:00 - 14:30', description: 'MySQL and data modeling', status: 'active', studentCount: 2, passingGrade: 60, weights },
  { id: 3, name: 'BSIT 2 - Programming 2', sectionCode: 'IT201-A', teacherId: 6, teacher: 'Jose Ramos', schedule: 'MWF 13:00 - 14:30', description: 'Object-oriented programming', status: 'completed', studentCount: 2, passingGrade: 75, weights },
];

export const mockRoster = {
  classId: 1,
  assessments: [
    { id: 1, title: 'Quiz 1', type: 'Quiz', perfectScore: 20 },
    { id: 2, title: 'Midterm Project', type: 'Project', perfectScore: 100 },
    { id: 3, title: 'Module Exam 1', type: 'Module Exam', perfectScore: 50 },
  ],
  students: [
    { id: 3, name: 'Juan Dela Cruz', email: 'juan.delacruz@edutrack.com', idNumber: '2026200001', scores: { 1: 18, 2: 88, 3: 41 } },
    { id: 4, name: 'Ana Reyes', email: 'ana.reyes@edutrack.com', idNumber: '2026200002', scores: { 1: 20, 2: 95, 3: 47 } },
    { id: 5, name: 'Carlo Mendoza', email: 'carlo.mendoza@edutrack.com', idNumber: '2026200003', scores: { 1: 9, 2: 60 } },
  ],
};

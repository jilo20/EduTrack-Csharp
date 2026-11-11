/*
 * MOCK DATA: attendance
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
// Status is one of: Present, Late, Absent, No Class
export const mockClassAttendance = [
  { studentId: 3, studentName: 'Juan Dela Cruz', status: 'Present', remarks: '' },
  { studentId: 4, studentName: 'Ana Reyes', status: 'Late', remarks: 'Arrived 9:15' },
  { studentId: 5, studentName: 'Carlo Mendoza', status: 'Absent', remarks: '' },
];

export const mockStudentAttendance = {
  rate: 89, // (Present + Late x 0.5) / days, ignoring No Class days
  classes: [
    {
      classId: 1,
      className: 'BSIT 3 - Web Development',
      rate: 92,
      records: [
        { date: '2026-10-12', status: 'Present', remarks: '' },
        { date: '2026-10-14', status: 'Late', remarks: 'Arrived 9:15' },
        { date: '2026-10-16', status: 'No Class', remarks: 'Holiday' },
        { date: '2026-10-19', status: 'Absent', remarks: '' },
      ],
    },
    { classId: 2, className: 'BSIT 3 - Database Systems', rate: 100, records: [{ date: '2026-10-13', status: 'Present', remarks: '' }] },
  ],
};

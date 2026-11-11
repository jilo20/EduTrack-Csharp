/*
 * MOCK DATA: announcements
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
// priority: normal, high, urgent      target: all, teachers, students
export const mockAnnouncements = [
  { id: 1, title: 'Midterm week schedule', content: 'Midterm exams run from October 26 to 30. Check your class schedule.', priority: 'high', target: 'all', className: null, author: 'System Admin', date: '2026-10-19' },
  { id: 2, title: 'Project deadline moved', content: 'The Midterm Project is now due on Friday.', priority: 'normal', target: 'students', className: 'BSIT 3 - Web Development', author: 'Maria Santos', date: '2026-10-18' },
  { id: 3, title: 'System maintenance tonight', content: 'EduTrack will be offline from 10 PM to 11 PM.', priority: 'urgent', target: 'all', className: null, author: 'System Admin', date: '2026-10-17' },
];

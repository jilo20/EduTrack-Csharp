/*
 * MOCK DATA: notifications
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
// type: info, announcement, warning      status: unread, read
export const mockNotifications = [
  { id: 1, title: 'New announcement', message: 'Midterm week schedule', type: 'announcement', status: 'unread', createdAt: '2026-10-19T08:00:00Z' },
  { id: 2, title: 'New student', message: 'Ana Reyes has joined your class (IT301-A).', type: 'info', status: 'unread', createdAt: '2026-10-18T14:20:00Z' },
  { id: 3, title: 'Semester Ended', message: 'BSIT 2 - Programming 2 (IT201-A) has been marked as completed. Final grade: 1.75 (85%).', type: 'info', status: 'read', createdAt: '2026-10-10T16:45:00Z' },
];

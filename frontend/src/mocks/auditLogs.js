/*
 * MOCK DATA: audit logs
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
export const mockAuditLogs = [
  { id: 5, timestamp: '2026-10-19T09:12:00Z', action: 'GRADE_CHANGED', actorName: 'Maria Santos', actorRole: 'Teacher', details: 'Grade changed from 15 to 18 for Juan Dela Cruz on "Quiz 1"' },
  { id: 4, timestamp: '2026-10-19T08:40:00Z', action: 'ATTENDANCE_MARKED', actorName: 'Maria Santos', actorRole: 'Teacher', details: 'Attendance marked for 3 students on 2026-10-19' },
  { id: 3, timestamp: '2026-10-18T15:05:00Z', action: 'USER_DEACTIVATED', actorName: 'System Admin', actorRole: 'Admin', details: 'Deactivated account for Carlo Mendoza' },
  { id: 2, timestamp: '2026-10-14T13:20:00Z', action: 'INVITE_GENERATED', actorName: 'System Admin', actorRole: 'Admin', details: 'Generated invite ID 2026615337 for role Teacher' },
  { id: 1, timestamp: '2026-10-10T16:45:00Z', action: 'END_SEMESTER', actorName: 'Jose Ramos', actorRole: 'Teacher', details: 'Ended the semester for BSIT 2 - Programming 2 (IT201-A)' },
];

/*
 * MOCK DATA: invite IDs
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
export const mockInvites = [
  { id: 1, idNumber: '2026482913', role: 'Student', isUsed: true, usedByEmail: 'juan.delacruz@edutrack.com', createdAt: '2026-10-12T08:30:00Z' },
  { id: 2, idNumber: '2026771204', role: 'Student', isUsed: false, usedByEmail: null, createdAt: '2026-10-13T09:10:00Z' },
  { id: 3, idNumber: '2026390558', role: 'Teacher', isUsed: true, usedByEmail: 'maria.santos@edutrack.com', createdAt: '2026-10-10T07:45:00Z' },
  { id: 4, idNumber: '2026615337', role: 'Teacher', isUsed: false, usedByEmail: null, createdAt: '2026-10-14T13:20:00Z' },
];

/*
 * MOCK DATA: users and login
 * Used only when VITE_USE_MOCK=true. Keep the shape the same as what the C# API returns.
 * Add more rows if your page needs them (long names, empty lists, edge cases).
 */
export const mockUsers = [
  { id: 1, firstName: 'System', lastName: 'Admin', email: 'admin@edutrack.com', role: 'Admin', idNumber: null, status: 'active' },
  { id: 2, firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@edutrack.com', role: 'Teacher', idNumber: '2026100001', status: 'active' },
  { id: 3, firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan.delacruz@edutrack.com', role: 'Student', idNumber: '2026200001', status: 'active' },
  { id: 4, firstName: 'Ana', lastName: 'Reyes', email: 'ana.reyes@edutrack.com', role: 'Student', idNumber: '2026200002', status: 'active' },
  { id: 5, firstName: 'Carlo', lastName: 'Mendoza', email: 'carlo.mendoza@edutrack.com', role: 'Student', idNumber: '2026200003', status: 'inactive' },
  { id: 6, firstName: 'Jose', lastName: 'Ramos', email: 'jose.ramos@edutrack.com', role: 'Teacher', idNumber: '2026100002', status: 'active' },
];

// Mock login: any password works. The email decides the role, so you can test all three.
//   admin@...   -> Admin      maria.santos@... -> Teacher      anything else -> Student
export const mockLogin = (email) => {
  const user = mockUsers.find((u) => u.email === email) ?? mockUsers[2];
  return { token: 'mock-token', user };
};

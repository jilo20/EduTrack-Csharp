/*
 * API calls for: auth
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockUsers, mockLogin } from '../mocks/users';

export const login = (email, password) =>
  USE_MOCK ? mock(mockLogin(email.trim().toLowerCase())) : request('/auth/login', { method: 'POST', body: { email, password } });

export const verifyId = (idNumber) =>
  USE_MOCK ? mock({ valid: true, role: idNumber.trim().toUpperCase().startsWith('T') ? 'Teacher' : 'Student' }) : request('/auth/verify-id', { method: 'POST', body: { idNumber } });

export const register = (data) => {
  if (!USE_MOCK) return request('/auth/register', { method: 'POST', body: data });

  const normalizedEmail = data.email.trim().toLowerCase();
  const role = data.idNumber.trim().toUpperCase().startsWith('T') ? 'Teacher' : 'Student';
  const existingUser = mockUsers.find((user) => user.email.toLowerCase() === normalizedEmail);
  const user = {
    ...mockUsers[2],
    ...data,
    ...(existingUser ? { id: existingUser.id } : { id: Math.max(...mockUsers.map((item) => item.id)) + 1 }),
    email: normalizedEmail,
    role,
    status: 'active',
  };

  if (existingUser) Object.assign(existingUser, user);
  else mockUsers.push(user);

  return mock({ token: 'mock-token', user });
};

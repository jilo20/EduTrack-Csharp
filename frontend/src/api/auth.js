/*
 * API calls for: auth
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockUsers, mockLogin } from '../mocks/users';
import { mockInvites } from '../mocks/invites';

// Mock mode: same rule as AuthController.FindInvite, an unused invite with that exact ID.
const findMockInvite = (idNumber) =>
  mockInvites.find((invite) => invite.idNumber === String(idNumber).trim() && !invite.isUsed);

export const login = (email, password) =>
  USE_MOCK ? mock(mockLogin(email.trim().toLowerCase())) : request('/auth/login', { method: 'POST', body: { email, password } });

export const verifyId = (idNumber) =>
  USE_MOCK
    ? mock({ valid: Boolean(findMockInvite(idNumber)), role: findMockInvite(idNumber)?.role ?? null })
    : request('/auth/verify-id', { method: 'POST', body: { idNumber } });

export const register = (data) => {
  if (!USE_MOCK) return request('/auth/register', { method: 'POST', body: data });

  const normalizedEmail = data.email.trim().toLowerCase();
  const invite = findMockInvite(data.idNumber);
  if (!invite) return Promise.reject(new Error('This ID is not valid or has already been used.'));
  if (mockUsers.some((user) => user.email.toLowerCase() === normalizedEmail))
    return Promise.reject(new Error('This email is already registered.'));

  const { password: _password, ...profile } = data;
  const user = {
    ...mockUsers[2],
    ...profile,
    id: Math.max(...mockUsers.map((item) => item.id)) + 1,
    email: normalizedEmail,
    role: invite.role,
    status: 'active',
  };
  mockUsers.push(user);
  invite.isUsed = true;
  invite.usedByEmail = normalizedEmail;

  return mock({ token: 'mock-token', user });
};

// 4.3 Forgot Password. Mock mode follows the same rules as the API: an account with this ID, and it must be active.
const findMockAccount = (idNumber) => mockUsers.find((user) => user.idNumber === String(idNumber).trim());

export const verifyResetId = (idNumber) => {
  if (!USE_MOCK) return request('/auth/forgot-password/verify', { method: 'POST', body: { idNumber } });
  const user = findMockAccount(idNumber);
  if (!user) return mock({ valid: false, error: 'No account uses this ID.' });
  if (user.status !== 'active') return mock({ valid: false, error: 'This account is inactive. Contact the admin.' });
  return mock({ valid: true, firstName: user.firstName });
};

export const resetPassword = (idNumber, password) => {
  if (!USE_MOCK) return request('/auth/forgot-password/reset', { method: 'POST', body: { idNumber, password } });
  const user = findMockAccount(idNumber);
  if (!user || user.status !== 'active') return Promise.reject(new Error('No active account uses this ID.'));
  return mock({ ok: true });
};

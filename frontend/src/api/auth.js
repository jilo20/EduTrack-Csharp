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

export const requestPasswordReset = (email) => {
  if (USE_MOCK) return Promise.reject(new Error('Connect to the local API to send reset email.'));
  return request('/auth/forgot-password/request', { method: 'POST', body: { email } });
};

export const resetPassword = (token, password) => {
  if (USE_MOCK) return Promise.reject(new Error('Connect to the local API to reset your password.'));
  return request('/auth/forgot-password/reset', { method: 'POST', body: { token, password } });
};

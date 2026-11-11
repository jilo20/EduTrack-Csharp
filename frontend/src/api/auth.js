/*
 * API calls for: auth
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockUsers, mockLogin } from '../mocks/users';

export const login = (email, password) =>
  USE_MOCK ? mock(mockLogin(email)) : request('/auth/login', { method: 'POST', body: { email, password } });

export const verifyId = (idNumber) =>
  USE_MOCK ? mock({ valid: true, role: idNumber.startsWith('T') ? 'Teacher' : 'Student' }) : request('/auth/verify-id', { method: 'POST', body: { idNumber } });

export const register = (data) =>
  USE_MOCK ? mock({ token: 'mock-token', user: { ...mockUsers[2], ...data } }) : request('/auth/register', { method: 'POST', body: data });

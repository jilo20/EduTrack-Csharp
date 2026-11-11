/*
 * API calls for: invites
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockInvites } from '../mocks/invites';

export const getInvites = () =>
  USE_MOCK ? mock(mockInvites) : request('/registeredid');

export const createInvite = (roleId) =>
  USE_MOCK ? mock({ id: Date.now(), idNumber: `2026${Math.floor(100000 + Math.random() * 900000)}`, role: roleId === 2 ? 'Teacher' : 'Student', isUsed: false, createdAt: new Date().toISOString() }) : request('/registeredid', { method: 'POST', body: { roleId } });

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

// Mock mode keeps the new invite in the shared list so Register can verify it.
function createMockInvite(roleId) {
  let idNumber;
  do idNumber = `${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`;
  while (mockInvites.some((invite) => invite.idNumber === idNumber));
  const invite = {
    id: Math.max(0, ...mockInvites.map((item) => item.id)) + 1,
    idNumber,
    role: roleId === 2 ? 'Teacher' : 'Student',
    isUsed: false,
    usedByEmail: null,
    createdAt: new Date().toISOString(),
  };
  mockInvites.unshift(invite);
  return mock(invite);
}

export const createInvite = (roleId) =>
  USE_MOCK ? createMockInvite(roleId) : request('/registeredid', { method: 'POST', body: { roleId } });

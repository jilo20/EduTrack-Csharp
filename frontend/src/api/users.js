/*
 * API calls for: users
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockUsers } from '../mocks/users';

export const getUsers = (role) =>
  USE_MOCK ? mock(role ? mockUsers.filter((u) => u.role === role) : mockUsers) : request(`/users${role ? `?role=${role}` : ''}`);

export const createUser = (data) =>
  USE_MOCK ? mock({ id: Date.now(), status: 'active', ...data }) : request('/users', { method: 'POST', body: data });

export const updateUser = (id, data) =>
  USE_MOCK ? mock({ ...mockUsers.find((u) => u.id === id), ...data }) : request(`/users/${id}`, { method: 'PUT', body: data });

export const deactivateUser = (id) =>
  USE_MOCK ? mock({ id, status: 'inactive' }) : request(`/users/${id}`, { method: 'DELETE' });

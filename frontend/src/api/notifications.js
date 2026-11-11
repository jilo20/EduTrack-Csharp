/*
 * API calls for: notifications
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockNotifications } from '../mocks/notifications';

export const getNotifications = () =>
  USE_MOCK ? mock(mockNotifications) : request('/notifications');

export const markRead = (id) =>
  USE_MOCK ? mock({ id, status: 'read' }) : request(`/notifications/${id}/read`, { method: 'POST' });

export const markAllRead = () =>
  USE_MOCK ? mock({ ok: true }) : request('/notifications/read-all', { method: 'POST' });

export const clearAll = () =>
  USE_MOCK ? mock({ ok: true }) : request('/notifications', { method: 'DELETE' });

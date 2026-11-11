/*
 * API calls for: announcements
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockAnnouncements } from '../mocks/announcements';

export const getAnnouncements = () =>
  USE_MOCK ? mock(mockAnnouncements) : request('/announcements');

export const createAnnouncement = (data) =>
  USE_MOCK ? mock({ id: Date.now(), date: new Date().toISOString().slice(0, 10), ...data }) : request('/announcements', { method: 'POST', body: data });

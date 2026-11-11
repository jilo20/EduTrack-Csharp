/*
 * API calls for: classes
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockClasses, mockRoster } from '../mocks/classes';

export const getClasses = (teacherId) =>
  USE_MOCK ? mock(teacherId ? mockClasses.filter((c) => c.teacherId === teacherId) : mockClasses) : request(`/classes${teacherId ? `?teacherId=${teacherId}` : ''}`);

export const createClass = (data) =>
  USE_MOCK ? mock({ id: Date.now(), status: 'active', studentCount: 0, ...data }) : request('/classes', { method: 'POST', body: data });

export const getRoster = (classId) =>
  USE_MOCK ? mock({ ...mockRoster, classId }) : request(`/classes/${classId}/roster`);

export const enrollStudents = (classId, studentIds) =>
  USE_MOCK ? mock({ classId, enrolled: studentIds.length }) : request(`/classes/${classId}/enroll`, { method: 'POST', body: { studentIds } });

export const updateWeights = (classId, weights) =>
  USE_MOCK ? mock({ classId, weights }) : request(`/classes/${classId}/weights`, { method: 'PUT', body: weights });

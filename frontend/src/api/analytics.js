/*
 * API calls for: analytics
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockAdminAnalytics, mockTeacherAnalytics, mockStudentAnalytics } from '../mocks/analytics';

export const getAdminAnalytics = () =>
  USE_MOCK ? mock(mockAdminAnalytics) : request('/analytics/admin');

export const getTeacherAnalytics = (teacherId) =>
  USE_MOCK ? mock(mockTeacherAnalytics) : request(`/analytics/teacher/${teacherId}`);

export const getStudentAnalytics = (studentId) =>
  USE_MOCK ? mock(mockStudentAnalytics) : request(`/analytics/student/${studentId}`);

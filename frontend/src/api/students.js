/*
 * API calls for: students
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockStudentDashboard, mockPerformance, mockStudentAssessments } from '../mocks/students';

export const getStudentDashboard = (studentId) =>
  USE_MOCK ? mock({ ...mockStudentDashboard, studentId }) : request(`/students/${studentId}/dashboard`);

export const getStudentPerformance = (studentId) =>
  USE_MOCK ? mock(mockPerformance) : request(`/students/${studentId}/performance`);

export const getStudentAssessments = (studentId) =>
  USE_MOCK ? mock(mockStudentAssessments) : request(`/students/${studentId}/assessments`);

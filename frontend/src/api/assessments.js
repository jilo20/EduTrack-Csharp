/*
 * API calls for: assessments
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockClassReport, mockStudentReport } from '../mocks/reports';

export const createAssessment = (data) =>
  USE_MOCK ? mock({ id: Date.now(), ...data }) : request('/assessments', { method: 'POST', body: data });

export const submitScores = (assessmentId, scores) =>
  USE_MOCK ? mock({ assessmentId, saved: scores.length }) : request(`/assessments/${assessmentId}/scores`, { method: 'POST', body: { scores } });

export const getClassReport = (classId) =>
  USE_MOCK ? mock({ ...mockClassReport, classId }) : request(`/classes/${classId}/report`);

export const getStudentReport = (classId, studentId) =>
  USE_MOCK ? mock({ ...mockStudentReport, classId, studentId }) : request(`/classes/${classId}/students/${studentId}/report`);

export const endSemester = (classId) =>
  USE_MOCK ? mock({ ...mockClassReport, classId, status: 'completed' }) : request(`/classes/${classId}/end-semester`, { method: 'POST' });

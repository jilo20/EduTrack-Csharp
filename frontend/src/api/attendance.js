/*
 * API calls for: attendance
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockClassAttendance, mockStudentAttendance } from '../mocks/attendance';

export const getClassAttendance = (classId, date) =>
  USE_MOCK ? mock(mockClassAttendance.map((r) => ({ ...r, classId, date }))) : request(`/attendance?classId=${classId}&date=${date}`);

export const markAttendance = (data) =>
  USE_MOCK ? mock({ saved: data.records.length }) : request('/attendance', { method: 'POST', body: data });

export const getStudentAttendance = (studentId) =>
  USE_MOCK ? mock({ ...mockStudentAttendance, studentId }) : request(`/students/${studentId}/attendance`);

/*
 * API calls for: auditLogs
 * Pages import from here, never from src/mocks/ directly.
 * Mock mode (VITE_USE_MOCK=true) returns sample data; otherwise the real C# API is called.
 * If the real API returns a different shape, fix it HERE so the pages do not change.
 */
import { USE_MOCK, mock, request } from './client';
import { mockAuditLogs } from '../mocks/auditLogs';

export const getAuditLogs = () =>
  USE_MOCK ? mock(mockAuditLogs) : request('/auditlogs');

/*
 * ==========================================================================
 * FILE:    src/api/client.js
 * OWNER:   Uytico, Felleandrei
 * WBS:     14.1 API Client & Token Handling
 * PURPOSE: The only file that talks to the backend. Every src/api/*.js file goes through here.
 *
 * MOCK MODE: VITE_USE_MOCK=true in .env.development makes every api function return data from src/mocks/
 *            so pages can be built before the C# API is ready. Set it to false to call the real API.
 * TODO: on a 401 response, clear the token and send the user to the login page;
 *       decide where the token is stored (the defense checklist prefers HttpOnly cookies over localStorage).
 * NOTE: the basic version below already works. Improve it, do not replace how other files call it.
 *
 * RULE:    Material UI components only. See frontend/README.md.
 * STATUS:  EMPTY - not started. Delete this line when you begin.
 * ==========================================================================
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const BASE_URL = '/api'; // vite.config.js forwards /api to the C# API on http://localhost:5025
const TOKEN_KEY = 'edutrack_token';
const USER_KEY = 'edutrack_user';

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

// Calls the real API. Throws an Error with the server's message when the request fails.
export async function request(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(BASE_URL + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || data?.detail || data?.title || `Request failed (${response.status})`);
  }
  return data;
}

// Returns mock data after a short delay, like a real request would.
export function mock(data, delayMs = 400) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), delayMs);
  });
}

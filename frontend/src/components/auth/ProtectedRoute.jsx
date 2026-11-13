import { Navigate, useLocation } from 'react-router-dom';
import { clearSession, getCurrentUser } from '../../api/client';

const VALID_ROLES = ['Admin', 'Teacher', 'Student'];

function isExpiredJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const encodedPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
    const payload = JSON.parse(atob(paddedPayload));
    if (payload.exp === undefined) return false;
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function getAuthenticatedUser() {
  try {
    const token = localStorage.getItem('edutrack_token')?.trim();
    const user = getCurrentUser();
    if (!token || !user || typeof user !== 'object' || !VALID_ROLES.includes(user.role) || isExpiredJwt(token)) {
      clearSession();
      return null;
    }
    return user;
  } catch {
    try {
      clearSession();
    } catch {
      // Storage may be unavailable; the guard still denies access.
    }
    return null;
  }
}

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const user = getAuthenticatedUser();

  if (!user) return <Navigate to="/" replace state={{ from: location }} />;
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

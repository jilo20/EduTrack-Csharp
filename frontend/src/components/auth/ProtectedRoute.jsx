/*
 * ==========================================================================
 * FILE:    src/components/auth/ProtectedRoute.jsx
 * OWNER:   Abaquita, Kea
 * WBS:     4.8 Route Guards & Logout
 * PURPOSE: Blocks pages from users who are not logged in or have the wrong role.
 *
 * TODO: if there is no token, redirect to "/". If `roles` is given and the user's role is not in it, redirect to /dashboard.
 *       Also build logout: clear the token and user, then go to "/".
 * NOTE: right now it lets everyone through so the team can work.
 *
 * RULE:    Material UI components only. See frontend/README.md.
 * STATUS:  EMPTY - not started. Delete this line when you begin.
 * ==========================================================================
 */

// eslint-disable-next-line no-unused-vars
export default function ProtectedRoute({ children, roles }) {
  return children;
}

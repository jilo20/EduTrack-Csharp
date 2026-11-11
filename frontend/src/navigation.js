/*
 * OWNER: Uytico, Felleandrei (WBS 14.2 Layout & Navigation)
 * The sidebar menu of each role. Paths must match the routes in src/App.jsx.
 */
// Which menu items each role should see. path is relative to /dashboard.
export const NAV = {
  Admin: [
    { label: 'Dashboard', path: '' },
    { label: 'Invite Center', path: 'invites' },
    { label: 'Users', path: 'users' },
    { label: 'All Classes', path: 'admin/classes' },
    { label: 'Broadcast', path: 'broadcast' },
    { label: 'Audit Logs', path: 'audit-logs' },
    { label: 'Announcements', path: 'announcements' },
  ],
  Teacher: [
    { label: 'Dashboard', path: '' },
    { label: 'My Classes', path: 'classes' },
    { label: 'Grading Hub', path: 'grading' },
    { label: 'Reports', path: 'reports' },
    { label: 'Attendance', path: 'attendance' },
    { label: 'Announcements', path: 'announcements' },
  ],
  Student: [
    { label: 'Dashboard', path: '' },
    { label: 'Performance', path: 'performance' },
    { label: 'Assessments', path: 'assessments' },
    { label: 'My Attendance', path: 'my-attendance' },
    { label: 'Announcements', path: 'announcements' },
  ],
};

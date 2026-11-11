/*
 * Shows the right dashboard for the logged-in user's role.
 * The three dashboards themselves belong to Abaquita, Kea (WBS 11.4, 11.5, 10.4).
 */
import { getCurrentUser } from '../../api/client';
import AdminDashboardPage from '../admin/AdminDashboardPage';
import StudentDashboardPage from '../student/StudentDashboardPage';
import TeacherDashboardPage from '../teacher/TeacherDashboardPage';

export default function DashboardHomePage() {
  const role = getCurrentUser()?.role;
  if (role === 'Teacher') return <TeacherDashboardPage />;
  if (role === 'Student') return <StudentDashboardPage />;
  return <AdminDashboardPage />;
}

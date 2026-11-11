/*
 * All routes of the app. Shared file: tell the team before changing a path.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminClassesPage from './pages/admin/AdminClassesPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import BroadcastCenterPage from './pages/admin/BroadcastCenterPage';
import InviteCenterPage from './pages/admin/InviteCenterPage';
import UserManagerPage from './pages/admin/UserManagerPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AnnouncementsPage from './pages/common/AnnouncementsPage';
import DashboardHomePage from './pages/common/DashboardHomePage';
import AcademicPerformancePage from './pages/student/AcademicPerformancePage';
import AssessmentsPage from './pages/student/AssessmentsPage';
import MyAttendancePage from './pages/student/MyAttendancePage';
import AttendanceManagerPage from './pages/teacher/AttendanceManagerPage';
import GradingHubPage from './pages/teacher/GradingHubPage';
import ReportsPage from './pages/teacher/ReportsPage';
import TeacherClassesPage from './pages/teacher/TeacherClassesPage';

const guard = (page, roles) => <ProtectedRoute roles={roles}>{page}</ProtectedRoute>;

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={guard(<DashboardLayout />)}>
            <Route index element={<DashboardHomePage />} />
            {/* Admin */}
            <Route path="invites" element={guard(<InviteCenterPage />, ['Admin'])} />
            <Route path="users" element={guard(<UserManagerPage />, ['Admin'])} />
            <Route path="admin/classes" element={guard(<AdminClassesPage />, ['Admin'])} />
            <Route path="broadcast" element={guard(<BroadcastCenterPage />, ['Admin'])} />
            <Route path="audit-logs" element={guard(<AuditLogsPage />, ['Admin'])} />
            {/* Teacher */}
            <Route path="classes" element={guard(<TeacherClassesPage />, ['Teacher'])} />
            <Route path="grading" element={guard(<GradingHubPage />, ['Teacher'])} />
            <Route path="reports" element={guard(<ReportsPage />, ['Teacher'])} />
            <Route path="attendance" element={guard(<AttendanceManagerPage />, ['Teacher'])} />
            {/* Student */}
            <Route path="performance" element={guard(<AcademicPerformancePage />, ['Student'])} />
            <Route path="assessments" element={guard(<AssessmentsPage />, ['Student'])} />
            <Route path="my-attendance" element={guard(<MyAttendancePage />, ['Student'])} />
            {/* Everyone */}
            <Route path="announcements" element={<AnnouncementsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

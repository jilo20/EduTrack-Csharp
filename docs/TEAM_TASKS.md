# EduTrack: Team Tasks

Who does what, and in which file. The source is the X marks in `WBS_v1.3.xlsx`.
If the WBS changes, update this file and the `OWNER:` line in the affected files.

## How to work

1. Find your section below. Do the tasks in WBS order.
2. Open the file. The comment at the top says what to build, the endpoints or API calls, and the rules.
3. Delete the `STATUS: EMPTY` line when you start, so everyone can see it is in progress.
4. Only edit files you own. If you need a change in someone else's file, ask the owner.
5. **Frontend:** build your page against mock data first (`VITE_USE_MOCK=true`). You do not need to wait for the backend.
   Read `frontend/README.md` before you write any page. **Material UI is required.**
6. **Backend:** the JSON you return must match the shape in `frontend/src/mocks/`. If you must change a shape, tell the page's owner.

## Summary

| Member | Tasks | Main area |
|---|---|---|
| Bazar, Angelo | 22 | Backend APIs: auth, users, classes, grading, attendance, analytics, announcements, audit |
| Lopez, Mary Vincent | 14 | Invites, weights, and student APIs; admin, teacher, and common pages |
| Abaquita, Kea | 13 | Login and register, class pages, student pages, dashboards |
| Peter, Nathalie | 16 | Database, seeding, testing, deployment |
| Uytico, Felleandrei | 5 | Shared frontend: API client, layout, loading and error states |
| Unassigned | 4 | Notifications API, UI review |

---

### Angelo's Work

**Bazar, Angelo**

| WBS | Part | File | What to do |
|---|---|---|---|
| 2.2 - 2.4 | Docs | Project Plan, WBS, HLD | Keep the three documents up to date. |
| 4.1 Login API, 4.2 Account Lockout, 4.3 Verify Invite ID API, 4.4 Register API | Backend | `Edutrack/Controllers/AuthController.cs` | Login and registration. |
| 4.1 Login API, 4.5 Role-Based Authorization | Backend | `Edutrack/Services/TokenService.cs` | Creates the JWT token that the frontend sends with every request. |
| 4.1 - 4.4 | Backend | `Edutrack/Dtos/Auth/` | DTOs: LoginDto, VerifyIdDto, RegisterDto, AuthResponseDto |
| 6.1 Users API: Add / Edit, 6.2 Deactivate, 6.3 Lists | Backend | `Edutrack/Controllers/UsersController.cs` | Admin manages user accounts. |
| 6.1 - 6.3 | Backend | `Edutrack/Dtos/User/` | DTOs: CreateUserDto, UpdateUserDto, UserDto |
| 7.1 Create Class API, 7.2 My Classes / All Classes API, 7.3 Enrollment & Roster API | Backend | `Edutrack/Controllers/ClassesController.cs` | Classes (sections), enrollment, and roster. |
| 7.1 - 7.3 | Backend | `Edutrack/Dtos/Classes/` | DTOs: CreateClassDto, ClassDto, EnrollStudentsDto, RosterDto |
| 8.1 Assessments API, 8.2 Scores API | Backend | `Edutrack/Controllers/AssessmentsController.cs` | Assessments and scores. |
| 8.1 - 8.2 | Backend | `Edutrack/Dtos/Assessments/` | DTOs: CreateAssessmentDto, AssessmentDto, SubmitScoresDto |
| 8.3 Grade Computation | Backend | `Edutrack/Services/GradeService.cs` | All grade math lives here so every controller gets the same numbers. |
| 8.4 Class Report API, 8.5 Student Report API, 8.6 End Semester API | Backend | `Edutrack/Controllers/ReportsController.cs` | Reports and ending the semester. |
| 8.4 - 8.6 | Backend | `Edutrack/Dtos/Reports/` | DTOs: ClassReportDto, StudentReportDto |
| 9.1 Mark Attendance API, 9.2 Attendance Records API | Backend | `Edutrack/Controllers/AttendanceController.cs` | Attendance. |
| 9.1 - 9.2 | Backend | `Edutrack/Dtos/Attendance/` | DTOs: MarkAttendanceDto, AttendanceRecordDto |
| 11.1 Admin Stats & Analytics API, 11.2 Teacher Analytics API, 11.3 Student Analytics API | Backend | `Edutrack/Controllers/AnalyticsController.cs` | Numbers for the dashboards and charts. |
| 11.1 - 11.3 | Backend | `Edutrack/Dtos/Analytics/` | DTOs: AdminAnalyticsDto, TeacherAnalyticsDto, StudentAnalyticsDto |
| 12.1 Announcements API | Backend | `Edutrack/Controllers/AnnouncementsController.cs` | Announcements. |
| 12.1 | Backend | `Edutrack/Dtos/Announcements/` | DTOs: CreateAnnouncementDto, AnnouncementDto |
| 13.1 Audit Logging | Backend | `Edutrack/Services/AuditLogService.cs` | One place to record important actions. |
| 13.2 Audit Logs API | Backend | `Edutrack/Controllers/AuditLogsController.cs` | Admin reads the audit trail. |
| 13.2 | Backend | `Edutrack/Dtos/AuditLogs/` | DTOs: AuditLogDto |

---

### Mary Vincent's Work

**Lopez, Mary Vincent**

| WBS | Part | File | What to do |
|---|---|---|---|
| 5.1 Invites API | Backend | `Edutrack/Controllers/RegisteredIdController.cs` (exists) | Add POST that auto-generates a unique ID (year + 6 random digits); the admin only sends the role. Admin only. Write an audit log. |
| 5.2 Invite Center Page | Frontend | `frontend/src/pages/admin/InviteCenterPage.jsx` | Admin generates invite IDs and sees which are used. |
| 6.4 User Manager Page | Frontend | `frontend/src/pages/admin/UserManagerPage.jsx` | Admin manages student and teacher accounts. |
| 7.4 Grading Weights API | Backend | `Edutrack/Controllers/ClassWeightsController.cs` | Change the category weights of a class. |
| 7.4 | Backend | `Edutrack/Dtos/ClassWeights/` | DTOs: UpdateWeightsDto |
| 8.7 Grading Hub Page | Frontend | `frontend/src/pages/teacher/GradingHubPage.jsx` | Teacher creates assessments and encodes scores. |
| 8.8 Reports & Export | Frontend | `frontend/src/pages/teacher/ReportsPage.jsx` | Class and student reports with PDF and CSV export. |
| 9.3 Attendance Manager Page | Frontend | `frontend/src/pages/teacher/AttendanceManagerPage.jsx` | Teacher marks and reviews attendance. |
| 9.4 My Attendance Page | Frontend | `frontend/src/pages/student/MyAttendancePage.jsx` | The student's own attendance. |
| 10.1 Student Dashboard API, 10.2 Performance API, 10.3 Assessments List API | Backend | `Edutrack/Controllers/StudentsController.cs` | What a student sees about themselves. |
| 10.1 - 10.3 | Backend | `Edutrack/Dtos/Students/` | DTOs: StudentDashboardDto, PerformanceDto |
| 12.3 Broadcast Center Page | Frontend | `frontend/src/pages/admin/BroadcastCenterPage.jsx` | Admin sends an announcement to all, teachers, or students. |
| 12.4 Announcements Page | Frontend | `frontend/src/pages/common/AnnouncementsPage.jsx` | Everyone views announcements; a teacher can post to a class. |
| 12.5 Notification Panel | Frontend | `frontend/src/components/common/NotificationPanel.jsx` | Bell icon with the unread count and the list of notifications. |

---

### Kea's Work

**Abaquita, Kea**

| WBS | Part | File | What to do |
|---|---|---|---|
| 4.6 Login Page | Frontend | `frontend/src/pages/auth/LoginPage.jsx` | Login form with error messages. After login, go to /dashboard. |
| 4.7 Register Page | Frontend | `frontend/src/pages/auth/RegisterPage.jsx` | Two steps: verify the invite ID, then fill in the account details. |
| 4.8 Route Guards & Logout | Frontend | `frontend/src/components/auth/ProtectedRoute.jsx` | Blocks pages from users who are not logged in or have the wrong role. |
| 7.5 Teacher Classes Page | Frontend | `frontend/src/pages/teacher/TeacherClassesPage.jsx` | Teacher's classes and the create-class dialog. The largest screen. |
| 7.6 Enrollment & Roster UI | Frontend | `frontend/src/components/teacher/EnrollmentRoster.jsx` | Pick students to enroll and show the class roster. |
| 7.7 Admin Classes Page | Frontend | `frontend/src/pages/admin/AdminClassesPage.jsx` | Admin sees every class in the system. |
| 10.4 Student Dashboard Page | Frontend | `frontend/src/pages/student/StudentDashboardPage.jsx` | The student's summary. |
| 10.5 Academic Performance Page | Frontend | `frontend/src/pages/student/AcademicPerformancePage.jsx` | Grades per class with the category breakdown. |
| 10.6 Assessments Page | Frontend | `frontend/src/pages/student/AssessmentsPage.jsx` | The student's assessments with score and status. |
| 11.4 Admin Dashboard | Frontend | `frontend/src/pages/admin/AdminDashboardPage.jsx` | Totals and charts for the admin. |
| 11.5 Teacher Dashboard | Frontend | `frontend/src/pages/teacher/TeacherDashboardPage.jsx` | Class summaries and charts for the teacher. |
| 11.6 Student Analytics Charts | Frontend | `frontend/src/components/student/StudentAnalyticsCharts.jsx` | Charts of the student's performance. |
| 13.3 Audit Logs Page | Frontend | `frontend/src/pages/admin/AuditLogsPage.jsx` | Admin reads the list of logged actions. |

---

### Nathalie's Work

**Peter, Nathalie**

| WBS | Part | File | What to do |
|---|---|---|---|
| 2.5 ERD & Database Design | Docs | ERD | Final ERD for the 10 tables. |
| 3.1 Database Design & Migrations | Backend | `Edutrack/Models/Section.cs` | Database table for Section. |
| 3.1 Database Design & Migrations | Backend | `Edutrack/Models/Enrollment.cs` | Database table for Enrollment. |
| 3.1 Database Design & Migrations | Backend | `Edutrack/Models/Assessment.cs` | Database table for Assessment. |
| 3.1 Database Design & Migrations | Backend | `Edutrack/Models/Score.cs` | Database table for Score. |
| 3.1 Database Design & Migrations | Backend | `Edutrack/Models/Attendance.cs` | Database table for Attendance. |
| 3.1 Database Design & Migrations | Backend | `Edutrack/Models/Announcement.cs` | Database table for Announcement. |
| 3.1 Database Design & Migrations | Backend | `Edutrack/Models/Notification.cs` | Database table for Notification. |
| 3.1 Database Design & Migrations | Backend | `Edutrack/Models/AuditLog.cs` | Database table for AuditLog. |
| 3.1 Database Design & Migrations | Backend | `Edutrack/Data/EdutrackContext.cs` (exists) | Add a DbSet for each new model. Add unique indexes: Users.Email, Users.IdNumber, RegisteredIds.IdNumber. |
| 3.2 Seed Default Data | Backend | `Edutrack/Data/DataExtensions.cs` (exists) | Roles are already seeded. Add the default admin account (hashed password). |
| 15.1 Unit Testing | Testing | `docs/TESTING.md` | Test each API endpoint and each page on its own. |
| 15.2 Integration Testing | Testing | `docs/TESTING.md` | Set VITE_USE_MOCK=false and test every page against the real API. |
| 15.3 System Testing | Testing | `docs/TESTING.md` | Full flows per role: admin, teacher, student. |
| 15.4 UAT & Bug Fixes | Testing | `docs/TESTING.md` | Log bugs in the Google Sheet and retest the fixes. |
| 15.5 Deployment | Release |  | Deploy the API, the database, and the frontend build. |

---

### Felleandrei's Work

**Uytico, Felleandrei**

| WBS | Part | File | What to do |
|---|---|---|---|
| 2.1 Requirements Gathering | Docs |  | Requirements list. |
| 14.3 Loading & Error States | Frontend | `frontend/src/components/common/LoadingState.jsx` | Shared loading indicator. Every page uses this while its data loads. |
| 14.3 Loading & Error States | Frontend | `frontend/src/components/common/ErrorState.jsx` | Shared error message with a Retry button. |
| 14.3 Loading & Error States | Frontend | `frontend/src/components/common/EmptyState.jsx` | Shared "nothing here yet" message for empty lists and tables. |
| 14.3 Loading & Error States | Frontend | `frontend/src/components/common/ErrorBoundary.jsx` | Catches a crash in any page and shows a friendly message instead of a blank screen. |

---

### Unassigned (needs an owner)

_No X is plotted for these in the WBS. Angelo to assign._

| WBS | Part | File | What to do |
|---|---|---|---|
| 2.6 UI Review | Docs |  | Review the existing Figma / React screens before the pages are rebuilt. |
| 12.2 Notifications API | Backend | `Edutrack/Controllers/NotificationsController.cs` | A user's notifications. |
| 12.2 Notifications API | Backend | `Edutrack/Services/NotificationService.cs` | One place to create notifications, used by other controllers. |
| 12.2 | Backend | `Edutrack/Dtos/Notifications/` | DTOs: NotificationDto |

---

## Who waits for whom

| Page (owner) | Needs this API (owner) | Until then |
|---|---|---|
| Login, Register (Kea) | AuthController (Angelo) | mock: `mocks/users.js` |
| Invite Center (Mary Vincent) | RegisteredIdController (Mary Vincent) | mock: `mocks/invites.js` |
| User Manager (Mary Vincent) | UsersController (Angelo) | mock: `mocks/users.js` |
| Teacher Classes, Roster, Admin Classes (Kea) | ClassesController (Angelo) | mock: `mocks/classes.js` |
| Grading Hub, Reports (Mary Vincent) | AssessmentsController, ReportsController (Angelo) | mock: `mocks/classes.js`, `mocks/reports.js` |
| Attendance pages (Mary Vincent) | AttendanceController (Angelo) | mock: `mocks/attendance.js` |
| Student pages (Kea) | StudentsController (Mary Vincent) | mock: `mocks/students.js` |
| Dashboards and charts (Kea) | AnalyticsController (Angelo) | mock: `mocks/analytics.js` |
| Broadcast, Announcements (Mary Vincent) | AnnouncementsController (Angelo) | mock: `mocks/announcements.js` |
| Notification Panel (Mary Vincent) | NotificationsController (**unassigned**) | mock: `mocks/notifications.js` |
| Audit Logs (Kea) | AuditLogsController (Angelo) | mock: `mocks/auditLogs.js` |
| Every model-based API (Angelo, Mary Vincent) | Models and migrations (Nathalie) | Nathalie's models come first |

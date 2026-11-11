# EduTrack Frontend

React + Vite + **Material UI**. Read this whole page before you write a page.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. In mock mode, log in with any password:

| Email | Role you get |
|---|---|
| `admin@edutrack.com` | Admin |
| `maria.santos@edutrack.com` | Teacher |
| anything else | Student |

## Rule 1: Material UI is required

Every screen must be built with Material UI (`@mui/material`). This keeps all pages looking like one app.

**Do**

- Use MUI components: `Button`, `TextField`, `Table`, `Dialog`, `Card`, `Tabs`, `Chip`, `Alert`, `Snackbar`, and so on.
- Lay out with `Box`, `Stack`, and `Grid`.
- Style with the `sx` prop and theme values: `sx={{ p: 2, color: 'text.secondary' }}`.
- Use icons from `@mui/icons-material`.
- Use `recharts` for charts.
- Use the shared `LoadingState`, `ErrorState`, and `EmptyState` components for loading, errors, and empty lists.

**Do not**

- Do not use plain HTML controls: no `<button>`, `<input>`, `<select>`, or `<table>`.
- Do not add `.css` files or `className` styling.
- Do not install another UI library (Bootstrap, Tailwind, Ant Design, Chakra).
- Do not write hex colors in a page. Colors live in `src/theme.js`: use `color="primary"` or `sx={{ bgcolor: 'primary.main' }}`.

Component list and examples: https://mui.com/material-ui/all-components/

## Rule 2: pages get data only from `src/api/`

```jsx
import { getUsers } from '../../api/users';

const users = await getUsers('Student');
```

Never import from `src/mocks/` in a page, and never call `fetch` in a page.

## Mock mode: build your page before the backend is ready

`.env.development` has one switch:

```
VITE_USE_MOCK=true    # api functions return the sample data in src/mocks/
VITE_USE_MOCK=false   # api functions call the real C# API on http://localhost:5025
```

Restart `npm run dev` after changing it.

- If your page needs more sample data (long names, an empty list, a failing student), add rows to your file in `src/mocks/`.
- Keep the mock shape the same as what the C# API returns. If they differ, fix the function in `src/api/`, so no page has to change.
- When the backend for your page is ready, switch to `false` and test again.

## Folders

```
src/
  api/          one file per feature; the only code that talks to the backend
    client.js   request(), mock(), token and current user      (Felleandrei)
  mocks/        sample data used in mock mode
  components/
    layout/     DashboardLayout: sidebar and top bar             (Felleandrei)
    common/     LoadingState, ErrorState, EmptyState, ErrorBoundary, NotificationPanel
    auth/       ProtectedRoute
    teacher/    EnrollmentRoster
    student/    StudentAnalyticsCharts
  pages/
    auth/       Login, Register
    admin/      Dashboard, Invite Center, Users, All Classes, Broadcast, Audit Logs
    teacher/    Dashboard, My Classes, Grading Hub, Reports, Attendance
    student/    Dashboard, Performance, Assessments, My Attendance
    common/     Announcements, DashboardHome (picks the dashboard by role)
  App.jsx       all routes (shared: tell the team before changing a path)
  theme.js      colors and fonts (shared)
```

## Your file

Every page and component already exists with a comment at the top: the owner, the WBS task, what to build, which API functions to call, and which MUI components fit.
Replace the `<PagePlaceholder />` with the real screen, and delete the `STATUS: EMPTY` line when you start.

The full list of who owns which file is in `docs/TEAM_TASKS.md`.

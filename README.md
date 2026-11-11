# EduTrack (C#)

Student Performance Tracker: a React frontend with an ASP.NET Core Web API and MySQL.

| Folder | What | Stack |
|---|---|---|
| `Edutrack/` | Backend API | C#, ASP.NET Core (.NET 10), EF Core 9, MySQL 8 |
| `frontend/` | Web app | React, Vite, Material UI |
| `docs/` | Team tasks and testing notes | |

**Start here:** `docs/TEAM_TASKS.md` lists every task, its owner, and its file.

## Run the backend

1. Start MySQL (service `MYSQL80`).
2. Check the connection string in `Edutrack/appsettings.json`.
3. Run the project from Visual Studio (F5), or:

```bash
dotnet run --project Edutrack
```

The API runs on http://localhost:5025. Migrations and the role seed run on startup.

## Run the frontend

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```

The app runs on http://localhost:5173. It starts in **mock mode**, so it works without the backend. See `frontend/README.md`.

## Roles

- **Admin:** generates invite IDs, manages users, sees all classes, broadcasts announcements, reads audit logs.
- **Teacher:** creates classes, enrolls students, adds assessments, encodes scores, marks attendance, ends the semester.
- **Student:** sees their dashboard, grades, assessments, attendance, and announcements.

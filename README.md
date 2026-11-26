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

## Test password reset locally

Start Mailpit in a separate terminal:

```bash
mailpit --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025
```

From the repository root, start the API with its default development profile:

```bash
dotnet run --project Edutrack
```

The same command works in PowerShell. The local launch profiles enable Mailpit.
Run the frontend with `VITE_USE_MOCK=false` in `frontend/.env.development`.
If Vite uses a different URL, set `PasswordReset__FrontendUrl` to that URL
before starting the API.

Open Forgot Password, enter an active test account's email, and open the
message at http://localhost:8025. Set a new password and sign in with it.
Try the same link again to check that it was consumed. Links expire after
15 minutes. Mailpit needs no account and captures the message locally.
Production recovery requires a verified email workflow and a production mail sender.

## Seed demo data locally

Start MySQL, then run this from the repository root:

```bash
DemoSeed__Enabled=true dotnet run --project Edutrack
```

In PowerShell, set `$env:DemoSeed__Enabled = 'true'` before running
`dotnet run --project Edutrack`. The seeder runs during startup in Development
and adds demo data to the configured database. Rerunning it skips existing
demo accounts and preserves edited grades and passwords.

Run the frontend with `VITE_USE_MOCK=false`. Sign in as teacher
`kea.abaquita@edutrack.test` to see two classes with graded work, or as student
`maryvincent.lopez@edutrack.test` to see performance across classes.
All demo accounts initially use `EduTrackDemo123!`.

## Roles

- **Admin:** generates invite IDs, manages users, sees all classes, broadcasts announcements, reads audit logs.
- **Teacher:** creates classes, enrolls students, adds assessments, encodes scores, marks attendance, ends the semester.
- **Student:** sees their dashboard, grades, assessments, attendance, and announcements.

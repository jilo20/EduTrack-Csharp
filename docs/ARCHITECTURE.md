# EduTrack backend architecture

Every request follows **Controller → Service → Repository → Database**.

```
Browser (React)
   │  HTTP + JWT
   ▼
Controllers/      HTTP only: read the request, call ONE service method, return Respond(result)
   │
   ▼
Services/         ALL business logic: rules, validation, permissions, calculations, audit logs, notifications
   │
   ▼
Repositories/     ALL database work: queries, inserts, updates, deletes (EF Core)
   │
   ▼
MySQL (EduTrackContext)
```

## What each layer may do

| Layer | Allowed | Not allowed |
|---|---|---|
| **Controller** | Route, `[Authorize]` roles, model validation, `Respond(await service.X(...))` | Queries, `EduTrackContext`, business rules |
| **Service** | Rules ("weights must total 100%", "teachers only manage their own classes"), calling repositories, `uow.SaveChangesAsync()` | `EduTrackContext`, EF Core, HTTP responses |
| **Repository** | EF Core queries and changes on `EduTrackContext` | Business rules, HTTP |

Checked with: `grep -rn "EduTrackContext\|EntityFrameworkCore" Edutrack/Controllers Edutrack/Services` returns nothing.

## Example: Create Class (`POST /api/classes`)

1. **`ClassesController.Create`** — one line: `Respond(await classes.CreateAsync(dto, Caller))`.
2. **`ClassService.CreateAsync`** — the rules: admin must choose a teacher; a teacher can only create their own class;
   the teacher must be an active Teacher; category names unique; weights 0–100 and total 100; audit log `CLASS_CREATED`.
3. **`UserRepository.GetByIdAsync`** loads the teacher; **`ClassRepository.Add`** stages the new section;
   **`UnitOfWork.SaveChangesAsync`** commits the section and the audit log in one save.

## Building blocks

| File | Purpose |
|---|---|
| `Controllers/ApiControllerBase.cs` | Base for all controllers. `Caller` (who is logged in) and `Respond(result)`, which maps a service result to 200 / 201 / 400 / 401 / 403 / 404 / 409 / 423. |
| `Services/Common/ServiceResult.cs` | What a service returns: a value, or an error (`Fail.NotFound("Class not found.")`). Services never build HTTP responses. |
| `Services/Common/Caller.cs` | The logged-in user's id and role, with the permission helpers `CanManage(section)` and `IsSelfOrAdmin(id)`. |
| `Repositories/UnitOfWork.cs` | Commits everything the repositories staged in one database save. |

## Map of the code

| Feature (WBS) | Controller | Service | Repositories |
|---|---|---|---|
| Login, lockout, register, forgot password (4.x) | `AuthController` | `AuthService` | `UserRepository`, `InviteRepository` |
| Invite IDs (5.1) | `RegisteredIdController` | `InviteService` | `InviteRepository`, `UserRepository` |
| Users (6.x) | `UsersController` | `UserService` | `UserRepository`, `InviteRepository` |
| Classes, roster, enrollment, weights (7.x) | `ClassesController`, `ClassWeightsController` | `ClassService` | `ClassRepository`, `AssessmentRepository`, `UserRepository` |
| Assessments, scores (8.1–8.2) | `AssessmentsController` | `AssessmentService` | `AssessmentRepository`, `ClassRepository` |
| Grade computation (8.3) | — | `GradeService` | `ClassRepository`, `AssessmentRepository`, `AttendanceRepository` |
| Reports, end semester (8.4–8.6) | `ReportsController` | `ReportService` | `ClassRepository`, `UserRepository` |
| Attendance (9.x) | `AttendanceController` | `AttendanceService` | `AttendanceRepository`, `ClassRepository` |
| Student portal (10.x) | `StudentsController` | `StudentService` | `ClassRepository`, `AssessmentRepository`, `AttendanceRepository` |
| Analytics (11.x) | `AnalyticsController` | `AnalyticsService` | all of the above |
| Announcements (12.1) | `AnnouncementsController` | `AnnouncementService` | `AnnouncementRepository`, `ClassRepository`, `UserRepository` |
| Notifications (12.2) | `NotificationsController` | `NotificationService` | `NotificationRepository` |
| Audit logs (13.x) | `AuditLogsController` | `AuditLogService` | `AuditLogRepository`, `UserRepository` |

## Tests

`python tests/api/run_api_tests.py <label>` builds the API, runs it against a separate `edutrack_test` database
(recreated each run), and executes 144 test cases covering every endpoint, including permission and validation errors.
The refactor to this architecture was checked by running the suite before and after: all 144 passed both times,
and 142 of 144 responses were identical (the other two 403 responses now include an error message).

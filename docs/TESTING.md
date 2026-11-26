# EduTrack: Testing

OWNER: Peter, Nathalie (WBS 16.1 - 16.4). Test runs below were executed on 2026-11-23 and 2026-11-24.

Bugs are tracked as GitHub Issues: https://github.com/jilo20/EduTrack-Csharp/issues

## Test environment

| Part | Setup |
|---|---|
| API | ASP.NET Core Web API (.NET 10), Controller -> Service -> Repository, run on `http://localhost:5099` |
| Database | MySQL 8, separate test database `edutrack_test` (dropped and recreated by the test runner) |
| Frontend | React + Vite in real mode (`VITE_USE_MOCK=false`), pointed at the test API with `EDUTRACK_API=http://localhost:5099` |
| Browser | Chromium (Claude Code browser pane) |

## 16.1 Unit testing (2026-11-23)

Every API endpoint, including permissions, validation errors and business rules.

- Test cases: `UTC_Group3_EduTrack.xlsx` (153 cases). Results: `UTR_Group3_EduTrack.xlsx`.
- How to run: `python tests/api/run_api_tests.py <label>`, then `python tests/api/build_test_documents.py tests/api/results/<label>.json <folder>`.
- Result: **153 / 153 passed** (commit d93f219). Rerun on 2026-11-24 after the bug fixes below: **153 / 153 passed**.

## 16.2 Integration testing (2026-11-24)

The real frontend against the real API and MySQL, with data (an active class with enrolled students, scores, attendance and an announcement). Every page was opened as its role and checked for: the expected data on screen, no failed API request, no console error, no error message and no crash.

| Role | Page | Result |
|---|---|---|
| Admin | Dashboard, Invite Center, User Manager, All Classes, Broadcast Center, Audit Logs, Announcements | 7 / 7 pass |
| Teacher | Dashboard, My Classes, Grading Hub, Reports, Attendance Manager, Announcements | 6 / 6 pass |
| Student | Dashboard, Academic Performance, Assessments, My Attendance, Announcements | 5 / 5 pass |

**Result: 18 / 18 pages pass.** One defect was found while doing this (BUG-1 below).

## 16.3 System testing (2026-11-24)

One complete flow through the screens, as real users would do it:

| # | Step (role) | Expected | Result |
|---|---|---|---|
| 1 | Admin generates a Student invite (Invite Center) | New ID shown as Available | Pass (2026829894) |
| 2 | New student registers with the invite (Register) | Invite verified as Student; account created | Pass (Bea Villanueva) |
| 3 | Teacher enrolls the student (My Classes > View Roster) | Roster shows 3 enrolled | Pass |
| 4 | Teacher adds "Quiz 2" (20 pts) and encodes scores (Grading Hub) | Score 25 > 20 is blocked; valid scores saved | Pass (see BUG-2) |
| 5 | Teacher marks attendance; student marked Late with a remark (Attendance Manager) | "Attendance saved" | Pass |
| 6 | Teacher posts a class announcement (Announcements) | Announcement listed | Pass |
| 7 | Student logs in (Dashboard) | Grade 80%, GWA 2.6, attendance 50%, 2 notifications, 3 announcements | Pass |
| 8 | Teacher views the class report (Reports) | Average 76.75%, 2 / 3 passing, failing grade shown as 5.00 | Pass |
| 9 | Teacher ends the semester (Reports > End semester > Confirm) | Class completed; student notified "final grade 2.60 (80%)" | Pass |
| 10 | After the semester ended | Enrolling and grading are refused | Pass |

**Result: 10 / 10 steps pass.**

## 16.4 Bug fixes (2026-11-24)

| ID | Found in | Defect | Fix | Retest |
|---|---|---|---|---|
| BUG-1 | Integration testing | Times read from the database were shown 8 hours early (stored in UTC, sent without a time zone, read by the browser as local time). Affected invites, audit logs, announcements, notifications. | `EduTrackContext` marks every DateTime read from MySQL as UTC. | Pass: invite times now match local time; 153 / 153 API tests pass |
| BUG-2 | System testing | Grading Hub: a score above the perfect score disabled Save with only a red field and no explanation. | The field now shows "Enter 0 to {perfect score}." | Pass: frontend builds and lints clean |

User acceptance testing by the team and its results go below.

## UAT (team)

| Tester | Role tested | Date | Findings | Status |
|---|---|---|---|---|
| | | | | |

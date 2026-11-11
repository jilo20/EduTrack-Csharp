# EduTrack: Testing

OWNER: Peter, Nathalie (WBS 15.1 - 15.4)

STATUS: EMPTY - not started.

## What goes here

- **Unit testing (15.1):** one table per API controller and per page: what was tested, expected result, actual result, pass or fail.
- **Integration testing (15.2):** set `VITE_USE_MOCK=false` in `frontend/.env.development`, run the API, and test every page against it.
- **System testing (15.3):** the full flow per role.
  - Admin: log in, generate an invite, manage users, broadcast, read audit logs.
  - Teacher: register with an invite, create a class, enroll students, add assessments, encode scores, mark attendance, view reports, end the semester.
  - Student: register with an invite, view the dashboard, grades, assessments, attendance, and announcements.
- **UAT and bug fixes (15.4):** bugs go in the team's Google Sheet; list the retest results here.

API requests for manual testing go in `Edutrack/Edutrack.http`.

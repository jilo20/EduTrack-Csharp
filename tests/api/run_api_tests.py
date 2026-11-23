"""
EduTrack API test runner (unit / regression tests for every endpoint).

What it does:
  1. Drops and recreates a separate test database (edutrack_test) - the real Edutrack database is never touched.
  2. Builds and starts the API on http://localhost:5099 against that database (migrations + admin seed run on startup).
  3. Runs every test case below in order and compares the HTTP status with the expected one.
  4. Writes results to tests/api/results/<label>.json and prints a pass/fail summary.

Usage (from the repository root, MySQL running):
  python tests/api/run_api_tests.py [label]

The MySQL credentials and the default admin come from Edutrack/appsettings.json and
Edutrack/appsettings.Development.json; nothing secret is printed or written to the results.
"""
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
API_DIR = os.path.join(ROOT, "Edutrack")
OUT_DIR = os.path.join(ROOT, "tests", "api", "results")
PORT = 5099
BASE = f"http://localhost:{PORT}/api"
TEST_DB = "edutrack_test"
MYSQL = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"


def read_json(path):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def connection_parts():
    cs = read_json(os.path.join(API_DIR, "appsettings.json"))["ConnectionStrings"]["Edutrack"]
    parts = dict(p.split("=", 1) for p in cs.strip(";").split(";") if "=" in p)
    return cs, {k.lower(): v for k, v in parts.items()}


def reset_test_database():
    _, p = connection_parts()
    env = dict(os.environ, MYSQL_PWD=p.get("password", p.get("pwd", "")))
    sql = f"DROP DATABASE IF EXISTS {TEST_DB};"
    subprocess.run([MYSQL, "-h", p.get("server", "localhost"), "-P", p.get("port", "3306"), "-u", p.get("user", p.get("uid", "root")),
                    "-e", sql], check=True, env=env, capture_output=True)


def start_api(build_dir):
    cs, _ = connection_parts()
    test_cs = re.sub(r"(?i)(database)=[^;]*", rf"\1={TEST_DB}", cs)
    subprocess.run(["dotnet", "build", API_DIR, "-nologo", "-v", "q", "-o", build_dir], check=True, capture_output=True)
    env = dict(os.environ, ASPNETCORE_ENVIRONMENT="Development", ASPNETCORE_URLS=f"http://localhost:{PORT}",
               ConnectionStrings__Edutrack=test_cs)
    log = open(os.path.join(build_dir, "api.log"), "w")
    proc = subprocess.Popen(["dotnet", os.path.join(build_dir, "Edutrack.dll")], cwd=API_DIR, env=env, stdout=log, stderr=log)
    for _ in range(60):
        try:
            urllib.request.urlopen(f"{BASE}/auth/me", timeout=1)
        except urllib.error.HTTPError:
            return proc  # 401 = the API is up
        except Exception:
            time.sleep(1)
    proc.kill()
    raise RuntimeError("API did not start; see api.log in the build folder")


def call(method, path, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, method=method, headers=headers,
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return r.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw) if raw else None
        except ValueError:
            return e.code, raw.decode(errors="replace")


TS = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}")
GENERATED_ID = re.compile(r"\b20\d{2}\d{6}\b")


def normalize(v):
    """Removes values that change on every run (timestamps, tokens, random ID numbers) so runs can be diffed."""
    if isinstance(v, dict):
        return {k: ("<token>" if k == "token" else normalize(x)) for k, x in v.items() if k not in ("traceId",)}
    if isinstance(v, list):
        return [normalize(x) for x in v]
    if isinstance(v, str):
        if TS.match(v):
            return "<timestamp>"
        return GENERATED_ID.sub("<generated-id>", v)
    return v


def hide_secrets(v):
    if isinstance(v, dict):
        return {k: ("<password>" if "password" in k.lower() else hide_secrets(x)) for k, x in v.items()}
    if isinstance(v, list):
        return [hide_secrets(x) for x in v]
    return v


class Runner:
    def __init__(self):
        self.results = []
        self.ctx = {}
        self.who = {}  # token -> account label, for the "actor" column

    def name(self, token, label):
        self.who[token] = label
        return token

    def case(self, cid, module, title, expected, method, path, body=None, token=None, check=None):
        status, data = call(method, path, body, token)
        ok = status == expected
        note = ""
        if ok and check:
            try:
                note = check(data) or ""
            except Exception as e:  # a failed assertion inside check
                ok, note = False, f"check failed: {e}"
        self.results.append({"id": cid, "module": module, "title": title, "method": method, "path": path,
                             "actor": self.who.get(token, "Not logged in") if token else "Not logged in",
                             "request": normalize(hide_secrets(body)) if body is not None else None,
                             "expected": expected, "actual": status, "pass": ok, "note": note,
                             "body": normalize(data)})
        mark = "PASS" if ok else "FAIL"
        print(f"  {mark} {cid:<9} {expected} -> {status}  {title}" + (f"  [{note}]" if note and not ok else ""))
        return data


def expect(cond, msg):
    if not cond:
        raise AssertionError(msg)


def run_cases(r: Runner):
    admin = read_json(os.path.join(API_DIR, "appsettings.Development.json"))["DefaultAdmin"]
    A = admin["Email"]
    today = dt.date.today()
    past = (today - dt.timedelta(days=1)).isoformat()
    future = (today + dt.timedelta(days=2)).isoformat()

    # ---------- 4.x Auth ----------
    d = r.case("AUTH-01", "Auth", "Admin logs in with the right password", 200, "POST", "/auth/login", {"email": A, "password": admin["Password"]},
               check=lambda b: expect(b["user"]["role"] == "Admin", "role is not Admin"))
    at = r.name(d["token"], "Admin")
    r.case("AUTH-02", "Auth", "Wrong password is refused and shows tries left", 401, "POST", "/auth/login", {"email": A, "password": "wrong-pass-1"},
           check=lambda b: expect("4 tries left" in b["error"], b))
    r.case("AUTH-03", "Auth", "Unknown email is refused", 401, "POST", "/auth/login", {"email": "nobody@edutrack.com", "password": "whatever123"})
    r.case("AUTH-04", "Auth", "Login with an invalid email format is rejected", 400, "POST", "/auth/login", {"email": "not-an-email", "password": "x"})
    r.case("AUTH-05", "Auth", "Me returns the logged-in user", 200, "GET", "/auth/me", token=at, check=lambda b: expect(b["email"] == A, b))
    r.case("AUTH-06", "Auth", "Me without a token is refused", 401, "GET", "/auth/me")
    r.case("AUTH-07", "Auth", "Verify ID: unknown invite is not valid", 200, "POST", "/auth/verify-id", {"idNumber": "1999000000"},
           check=lambda b: expect(b["valid"] is False, b))

    # ---------- 5.x Invites ----------
    r.case("INV-01", "Invites", "Admin generates a Teacher invite", 201, "POST", "/registeredid", {"roleId": 2}, at,
           check=lambda b: expect(b["role"] == "Teacher" and len(b["idNumber"]) == 10, b))
    t_inv_id = next(x["idNumber"] for x in call("GET", "/registeredid", token=at)[1] if x["role"] == "Teacher")
    ids = []
    for i in range(3):
        b = r.case(f"INV-0{2 + i}", "Invites", f"Admin generates Student invite #{i + 1}", 201, "POST", "/registeredid", {"roleId": 3}, at)
        ids.append(b["idNumber"])
    t2 = r.case("INV-05", "Invites", "Admin generates a second Teacher invite", 201, "POST", "/registeredid", {"roleId": 2}, at)["idNumber"]
    r.case("INV-06", "Invites", "Generating an Admin invite is rejected", 400, "POST", "/registeredid", {"roleId": 1}, at)
    r.case("INV-07", "Invites", "Admin lists invites, newest first", 200, "GET", "/registeredid", token=at, check=lambda b: expect(len(b) == 5, len(b)))
    r.case("INV-08", "Invites", "Get invite by id", 200, "GET", "/registeredid/1", token=at)
    r.case("INV-09", "Invites", "Unknown invite id is not found", 404, "GET", "/registeredid/9999", token=at)
    r.case("INV-10", "Invites", "Invites need a login", 401, "GET", "/registeredid")
    r.case("AUTH-08", "Auth", "Verify ID: unused invite is valid and shows its role", 200, "POST", "/auth/verify-id", {"idNumber": t_inv_id},
           check=lambda b: expect(b["valid"] and b["role"] == "Teacher", b))

    # ---------- 4.4 Register ----------
    pw = "Passw0rd!23"
    b = r.case("REG-01", "Register", "Teacher registers with a Teacher invite", 200, "POST", "/auth/register",
               {"idNumber": t_inv_id, "firstName": "Maria", "lastName": "Santos", "email": "maria@test.com", "password": pw},
               check=lambda b: expect(b["user"]["role"] == "Teacher", b))
    tt = r.name(b["token"], "Teacher (Maria Santos)")
    teacher_id = b["user"]["id"]
    r.case("REG-02", "Register", "A used invite cannot register again", 400, "POST", "/auth/register",
           {"idNumber": t_inv_id, "firstName": "X", "lastName": "Y", "email": "other@test.com", "password": pw})
    r.case("REG-03", "Register", "Duplicate email is refused", 409, "POST", "/auth/register",
           {"idNumber": ids[0], "firstName": "X", "lastName": "Y", "email": "maria@test.com", "password": pw})
    r.case("REG-04", "Register", "Password shorter than 8 characters is rejected", 400, "POST", "/auth/register",
           {"idNumber": ids[0], "firstName": "X", "lastName": "Y", "email": "x@test.com", "password": "short"})
    students = []
    for i, (fn, ln) in enumerate([("Juan", "Dela Cruz"), ("Ana", "Reyes"), ("Carlo", "Mendoza")]):
        b = r.case(f"REG-0{5 + i}", "Register", f"Student {fn} registers with a Student invite", 200, "POST", "/auth/register",
                   {"idNumber": ids[i], "firstName": fn, "lastName": ln, "email": f"{fn.lower()}@test.com", "password": pw},
                   check=lambda b: expect(b["user"]["role"] == "Student", b))
        students.append({"id": b["user"]["id"], "token": r.name(b["token"], f"Student ({fn} {ln})"), "idNumber": ids[i]})
    b = r.case("REG-08", "Register", "Second teacher registers", 200, "POST", "/auth/register",
               {"idNumber": t2, "firstName": "Jose", "lastName": "Ramos", "email": "jose@test.com", "password": pw})
    t2t, teacher2_id = r.name(b["token"], "Teacher 2 (Jose Ramos)"), b["user"]["id"]
    s1, s2, s3 = students
    r.case("AUTH-09", "Auth", "Registered teacher can log in", 200, "POST", "/auth/login", {"email": "maria@test.com", "password": pw})

    # ---------- 6.x Users ----------
    r.case("USR-01", "Users", "Admin lists all users", 200, "GET", "/users", token=at, check=lambda b: expect(len(b) == 6, len(b)))
    r.case("USR-02", "Users", "Admin lists only teachers", 200, "GET", "/users?role=Teacher", token=at, check=lambda b: expect(len(b) == 2, len(b)))
    r.case("USR-03", "Users", "Teacher lists the student pool", 200, "GET", "/users?role=Student", token=tt, check=lambda b: expect(len(b) == 3, len(b)))
    r.case("USR-04", "Users", "Teacher cannot list teachers", 403, "GET", "/users?role=Teacher", token=tt)
    r.case("USR-05", "Users", "Unknown role filter is rejected", 400, "GET", "/users?role=Janitor", token=at)
    r.case("USR-06", "Users", "Student cannot list users", 403, "GET", "/users?role=Student", token=s1["token"])
    b = r.case("USR-07", "Users", "Admin adds a student account", 201, "POST", "/users",
               {"firstName": "Liza", "lastName": "Cruz", "email": "liza@test.com", "password": pw, "roleId": 3}, at)
    liza = b["id"]
    r.case("USR-08", "Users", "Adding a duplicate email is refused", 409, "POST", "/users",
           {"firstName": "L", "lastName": "C", "email": "liza@test.com", "password": pw, "roleId": 3}, at)
    r.case("USR-09", "Users", "Adding with an unknown role is refused", 400, "POST", "/users",
           {"firstName": "L", "lastName": "C", "email": "l2@test.com", "password": pw, "roleId": 9}, at)
    r.case("USR-10", "Users", "Teacher cannot add users", 403, "POST", "/users",
           {"firstName": "L", "lastName": "C", "email": "l3@test.com", "password": pw, "roleId": 3}, tt)
    r.case("USR-11", "Users", "Admin edits a user", 200, "PUT", f"/users/{liza}",
           {"firstName": "Liza", "lastName": "Cruz-Santos", "email": "liza@test.com", "roleId": 3, "status": "active"}, at,
           check=lambda b: expect(b["lastName"] == "Cruz-Santos", b))
    r.case("USR-12", "Users", "Editing to another user's email is refused", 409, "PUT", f"/users/{liza}",
           {"firstName": "Liza", "lastName": "C", "email": "maria@test.com", "roleId": 3, "status": "active"}, at)
    r.case("USR-13", "Users", "Editing an unknown user is not found", 404, "PUT", "/users/9999",
           {"firstName": "X", "lastName": "Y", "email": "x9@test.com", "roleId": 3, "status": "active"}, at)
    r.case("USR-14", "Users", "Admin cannot deactivate themself by editing", 400, "PUT", "/users/1",
           {"firstName": "System", "lastName": "Admin", "email": A, "roleId": 1, "status": "inactive"}, at)
    r.case("USR-15", "Users", "Admin deactivates a user", 200, "DELETE", f"/users/{liza}", token=at,
           check=lambda b: expect(b["status"] == "inactive", b))
    r.case("USR-16", "Users", "Admin cannot deactivate their own account", 400, "DELETE", "/users/1", token=at)
    r.case("USR-17", "Users", "Deactivating an unknown user is not found", 404, "DELETE", "/users/9999", token=at)
    r.case("AUTH-10", "Auth", "Deactivated user cannot log in", 403, "POST", "/auth/login", {"email": "liza@test.com", "password": pw})
    r.case("USR-18", "Users", "Teacher's student pool hides inactive students", 200, "GET", "/users?role=Student", token=tt,
           check=lambda b: expect(all(u["status"] == "active" for u in b), b))

    # ---------- 7.x Classes ----------
    cls = {"name": "BSIT 3 - Web Development", "sectionCode": "IT301-A", "schedule": "MWF 9:00", "passingGrade": 75}
    b = r.case("CLS-01", "Classes", "Teacher creates a class (default weights)", 201, "POST", "/classes", cls, tt,
               check=lambda b: expect(sum(b["weights"].values()) == 100, b))
    c1 = b["id"]
    r.case("CLS-02", "Classes", "Duplicate category names are rejected", 400, "POST", "/classes",
           {**cls, "sectionCode": "IT301-B", "weights": {"Quiz": 50, " quiz ": 50}}, tt)
    r.case("CLS-03", "Classes", "Weights that do not total 100 are rejected", 400, "POST", "/classes",
           {**cls, "sectionCode": "IT301-B", "weights": {"Quiz": 50, "Exam": 40}}, tt)
    r.case("CLS-04", "Classes", "Passing grade 0 is rejected", 400, "POST", "/classes", {**cls, "sectionCode": "IT301-B", "passingGrade": 0}, tt)
    r.case("CLS-05", "Classes", "Teacher cannot create a class for another teacher", 403, "POST", "/classes",
           {**cls, "sectionCode": "IT301-B", "teacherId": teacher2_id}, tt)
    r.case("CLS-06", "Classes", "Admin must choose the teacher", 400, "POST", "/classes", {**cls, "sectionCode": "IT302-A"}, at)
    r.case("CLS-07", "Classes", "Admin cannot assign a student as teacher", 400, "POST", "/classes", {**cls, "sectionCode": "IT302-A", "teacherId": s1["id"]}, at)
    b = r.case("CLS-08", "Classes", "Admin creates a class for teacher 2 (custom weights)", 201, "POST", "/classes",
               {**cls, "name": "BSIT 2 - Programming 2", "sectionCode": "IT201-A", "teacherId": teacher2_id,
                "weights": {"Quiz": 40, "Project": 60}}, at)
    c2 = b["id"]
    r.case("CLS-09", "Classes", "Teacher sees only their own classes", 200, "GET", "/classes", token=tt, check=lambda b: expect(len(b) == 1 and b[0]["id"] == c1, b))
    r.case("CLS-10", "Classes", "Teacher cannot list another teacher's classes", 403, "GET", f"/classes?teacherId={teacher2_id}", token=tt)
    r.case("CLS-11", "Classes", "Admin sees all classes", 200, "GET", "/classes", token=at, check=lambda b: expect(len(b) == 2, b))
    r.case("CLS-12", "Classes", "Admin filters classes by teacher", 200, "GET", f"/classes?teacherId={teacher2_id}", token=at, check=lambda b: expect(len(b) == 1, b))
    r.case("CLS-13", "Classes", "Student cannot list classes", 403, "GET", "/classes", token=s1["token"])
    r.case("CLS-14", "Classes", "Teacher enrolls 3 students", 200, "POST", f"/classes/{c1}/enroll", {"studentIds": [s1["id"], s2["id"], s3["id"]]}, tt,
           check=lambda b: expect(b["enrolled"] == 3, b))
    r.case("CLS-15", "Classes", "Enrolling again skips students already in the class", 200, "POST", f"/classes/{c1}/enroll", {"studentIds": [s1["id"]]}, tt,
           check=lambda b: expect(b["enrolled"] == 0 and b["alreadyEnrolled"] == 1, b))
    r.case("CLS-16", "Classes", "Enrolling an inactive or non-student account is rejected", 400, "POST", f"/classes/{c1}/enroll", {"studentIds": [liza, teacher_id]}, tt)
    r.case("CLS-17", "Classes", "Teacher cannot enroll into another teacher's class", 403, "POST", f"/classes/{c2}/enroll", {"studentIds": [s1["id"]]}, tt)
    r.case("CLS-18", "Classes", "Enrolling into an unknown class is not found", 404, "POST", "/classes/9999/enroll", {"studentIds": [s1["id"]]}, tt)
    r.case("CLS-19", "Classes", "Teacher views the roster", 200, "GET", f"/classes/{c1}/roster", token=tt, check=lambda b: expect(len(b["students"]) == 3, b))
    r.case("CLS-20", "Classes", "Teacher cannot view another teacher's roster", 403, "GET", f"/classes/{c2}/roster", token=tt)
    r.case("CLS-21", "Classes", "Class list shows the student count", 200, "GET", "/classes", token=tt, check=lambda b: expect(b[0]["studentCount"] == 3, b))
    upd = {"name": "BSIT 3 - Web Development 2", "sectionCode": "IT301-A", "description": "React, REST APIs and testing",
           "schedule": "TTh 10:00 - 11:30", "passingGrade": 70}
    r.case("CLS-22", "Classes", "Teacher updates their class's details", 200, "PUT", f"/classes/{c1}", upd, tt,
           check=lambda b: expect(b["name"] == upd["name"] and b["schedule"] == upd["schedule"] and b["passingGrade"] == 70
                                  and b["studentCount"] == 3 and sum(b["weights"].values()) == 100, b))
    r.case("CLS-23", "Classes", "The update is saved (class list shows it)", 200, "GET", "/classes", token=tt,
           check=lambda b: expect(b[0]["name"] == upd["name"] and b[0]["description"] == upd["description"], b))
    r.case("CLS-24", "Classes", "Update with passing grade 0 is rejected", 400, "PUT", f"/classes/{c1}", {**upd, "passingGrade": 0}, tt)
    r.case("CLS-25", "Classes", "Update with an empty name is rejected", 400, "PUT", f"/classes/{c1}", {**upd, "name": ""}, tt)
    r.case("CLS-26", "Classes", "Teacher cannot update another teacher's class", 403, "PUT", f"/classes/{c2}", upd, tt)
    r.case("CLS-27", "Classes", "Updating an unknown class is not found", 404, "PUT", "/classes/9999", upd, tt)
    r.case("CLS-28", "Classes", "Student cannot update a class", 403, "PUT", f"/classes/{c1}", upd, s1["token"])
    r.case("CLS-29", "Classes", "Admin updates any teacher's class", 200, "PUT", f"/classes/{c2}",
           {"name": "BSIT 2 - Programming 2", "sectionCode": "IT201-B", "schedule": "MWF 13:00", "passingGrade": 75}, at,
           check=lambda b: expect(b["sectionCode"] == "IT201-B" and b["teacherId"] == teacher2_id, b))

    # ---------- 7.4 Weights ----------
    r.case("WGT-01", "Weights", "Teacher updates the class weights", 200, "PUT", f"/classes/{c1}/weights", {"Quiz": 30, "Project": 30, "Module Exam": 40}, tt)
    r.case("WGT-02", "Weights", "Weights that do not total 100 are rejected", 400, "PUT", f"/classes/{c1}/weights", {"Quiz": 30, "Project": 30}, tt)
    r.case("WGT-03", "Weights", "Teacher cannot change another teacher's weights", 403, "PUT", f"/classes/{c2}/weights", {"Quiz": 50, "Project": 50}, tt)
    r.case("WGT-04", "Weights", "Unknown class is not found", 404, "PUT", "/classes/9999/weights", {"Quiz": 100}, tt)

    # ---------- 8.x Assessments & scores ----------
    b = r.case("ASM-01", "Assessments", "Teacher adds a Quiz", 201, "POST", "/assessments", {"sectionId": c1, "title": "Quiz 1", "type": "quiz", "perfectScore": 20},
               tt, check=lambda b: expect(b["type"] == "Quiz", b))
    q1 = b["id"]
    q2 = r.case("ASM-02", "Assessments", "Teacher adds a Project", 201, "POST", "/assessments", {"sectionId": c1, "title": "Midterm Project", "type": "Project", "perfectScore": 50}, tt)["id"]
    r.case("ASM-03", "Assessments", "Type outside the class's categories is rejected", 400, "POST", "/assessments", {"sectionId": c1, "title": "Lab 1", "type": "Lab", "perfectScore": 10}, tt)
    r.case("ASM-04", "Assessments", "Teacher cannot add to another teacher's class", 403, "POST", "/assessments", {"sectionId": c2, "title": "Quiz X", "type": "Quiz", "perfectScore": 10}, tt)
    r.case("ASM-05", "Assessments", "Unknown class is not found", 404, "POST", "/assessments", {"sectionId": 9999, "title": "Quiz X", "type": "Quiz", "perfectScore": 10}, tt)
    r.case("ASM-06", "Assessments", "Student cannot add assessments", 403, "POST", "/assessments", {"sectionId": c1, "title": "Quiz X", "type": "Quiz", "perfectScore": 10}, s1["token"])
    r.case("SCR-01", "Scores", "Teacher encodes quiz scores", 200, "POST", f"/assessments/{q1}/scores",
           {"scores": [{"studentId": s1["id"], "score": 18}, {"studentId": s2["id"], "score": 12}, {"studentId": s3["id"], "score": 8}]}, tt,
           check=lambda b: expect(b["added"] == 3, b))
    r.case("SCR-02", "Scores", "Teacher encodes project scores", 200, "POST", f"/assessments/{q2}/scores",
           {"scores": [{"studentId": s1["id"], "score": 45}, {"studentId": s2["id"], "score": 40}]}, tt)
    r.case("SCR-03", "Scores", "Changing a score updates it (with reason)", 200, "POST", f"/assessments/{q1}/scores",
           {"scores": [{"studentId": s2["id"], "score": 14}], "reason": "Recheck"}, tt, check=lambda b: expect(b["changed"] == 1, b))
    r.case("SCR-04", "Scores", "Score above the perfect score is rejected", 400, "POST", f"/assessments/{q1}/scores", {"scores": [{"studentId": s1["id"], "score": 25}]}, tt)
    r.case("SCR-05", "Scores", "The same student twice is rejected", 400, "POST", f"/assessments/{q1}/scores",
           {"scores": [{"studentId": s1["id"], "score": 10}, {"studentId": s1["id"], "score": 11}]}, tt)
    r.case("SCR-06", "Scores", "A student not in the class is rejected", 400, "POST", f"/assessments/{q1}/scores", {"scores": [{"studentId": liza, "score": 10}]}, tt)
    r.case("SCR-07", "Scores", "Unknown assessment is not found", 404, "POST", "/assessments/9999/scores", {"scores": [{"studentId": s1["id"], "score": 10}]}, tt)
    r.case("SCR-08", "Scores", "Teacher cannot score another teacher's class", 403, "POST", f"/assessments/{q1}/scores", {"scores": [{"studentId": s1["id"], "score": 10}]}, t2t)

    # ---------- 9.x Attendance ----------
    r.case("ATT-01", "Attendance", "Teacher marks attendance", 200, "POST", "/attendance",
           {"sectionId": c1, "date": past, "records": [{"studentId": s1["id"], "status": "Present"}, {"studentId": s2["id"], "status": "late", "remarks": "Arrived 9:15"},
                                                        {"studentId": s3["id"], "status": "Absent"}]}, tt)
    r.case("ATT-02", "Attendance", "Saving the same date again updates it", 200, "POST", "/attendance",
           {"sectionId": c1, "date": past, "records": [{"studentId": s3["id"], "status": "Present"}]}, tt)
    r.case("ATT-03", "Attendance", "A future date is rejected", 400, "POST", "/attendance", {"sectionId": c1, "date": future, "records": [{"studentId": s1["id"], "status": "Present"}]}, tt)
    r.case("ATT-04", "Attendance", "An unknown status is rejected", 400, "POST", "/attendance", {"sectionId": c1, "date": past, "records": [{"studentId": s1["id"], "status": "Sleeping"}]}, tt)
    r.case("ATT-05", "Attendance", "A student not in the class is rejected", 400, "POST", "/attendance", {"sectionId": c1, "date": past, "records": [{"studentId": liza, "status": "Present"}]}, tt)
    r.case("ATT-06", "Attendance", "Teacher cannot mark another teacher's class", 403, "POST", "/attendance", {"sectionId": c2, "date": past, "records": [{"studentId": s1["id"], "status": "Present"}]}, tt)
    r.case("ATT-07", "Attendance", "Teacher reads one class and date", 200, "GET", f"/attendance?classId={c1}&date={past}", token=tt,
           check=lambda b: expect([x["status"] for x in b].count("Present") == 2, b))
    r.case("ATT-08", "Attendance", "Student reads their own attendance", 200, "GET", f"/students/{s2['id']}/attendance", token=s2["token"],
           check=lambda b: expect(b["rate"] == 50.0, b))
    r.case("ATT-09", "Attendance", "Student cannot read another student's attendance", 403, "GET", f"/students/{s1['id']}/attendance", token=s2["token"])

    # ---------- 8.4-8.5 Reports ----------
    r.case("RPT-01", "Reports", "Teacher views the class report", 200, "GET", f"/classes/{c1}/report", token=tt,
           check=lambda b: expect(b["totalStudents"] == 3 and b["classAverage"] is not None, b))
    r.case("RPT-02", "Reports", "Teacher cannot view another teacher's class report", 403, "GET", f"/classes/{c2}/report", token=tt)
    r.case("RPT-03", "Reports", "Student views their own class report", 200, "GET", f"/classes/{c1}/students/{s1['id']}/report", token=s1["token"],
           check=lambda b: expect(b["description"] is not None, b))
    r.case("RPT-04", "Reports", "Student cannot view a classmate's report", 403, "GET", f"/classes/{c1}/students/{s2['id']}/report", token=s1["token"])
    r.case("RPT-05", "Reports", "Report for a student not in the class is not found", 404, "GET", f"/classes/{c1}/students/{liza}/report", token=tt)

    # ---------- 10.x Student portal ----------
    r.case("STU-01", "Student", "Student dashboard", 200, "GET", f"/students/{s1['id']}/dashboard", token=s1["token"], check=lambda b: expect(len(b["classes"]) == 1, b))
    r.case("STU-02", "Student", "Student performance per class", 200, "GET", f"/students/{s1['id']}/performance", token=s1["token"])
    r.case("STU-03", "Student", "Student assessments list", 200, "GET", f"/students/{s3['id']}/assessments", token=s3["token"],
           check=lambda b: expect(sorted(x["status"] for x in b) == ["Graded", "Pending"], b))
    r.case("STU-04", "Student", "Student cannot open another student's dashboard", 403, "GET", f"/students/{s2['id']}/dashboard", token=s1["token"])
    r.case("STU-05", "Student", "Teacher cannot use the student portal", 403, "GET", f"/students/{s1['id']}/dashboard", token=tt)
    r.case("STU-06", "Student", "Admin opening a non-student id is not found", 404, "GET", f"/students/{teacher_id}/dashboard", token=at)

    # ---------- 11.x Analytics ----------
    r.case("ANL-01", "Analytics", "Admin analytics", 200, "GET", "/analytics/admin", token=at, check=lambda b: expect(b["totals"]["students"] == 3, b))
    r.case("ANL-02", "Analytics", "Teacher cannot open admin analytics", 403, "GET", "/analytics/admin", token=tt)
    r.case("ANL-03", "Analytics", "Teacher analytics (own)", 200, "GET", f"/analytics/teacher/{teacher_id}", token=tt)
    r.case("ANL-04", "Analytics", "Teacher cannot open another teacher's analytics", 403, "GET", f"/analytics/teacher/{teacher2_id}", token=tt)
    r.case("ANL-05", "Analytics", "Student analytics (own)", 200, "GET", f"/analytics/student/{s1['id']}", token=s1["token"])
    r.case("ANL-06", "Analytics", "Student cannot open another student's analytics", 403, "GET", f"/analytics/student/{s2['id']}", token=s1["token"])

    # ---------- 12.x Announcements & notifications ----------
    r.case("ANN-01", "Announcements", "Admin broadcasts to everyone", 201, "POST", "/announcements", {"title": "Midterm week", "content": "No classes Friday.", "priority": "high", "target": "all"}, at)
    r.case("ANN-02", "Announcements", "Teacher posts to their own class", 201, "POST", "/announcements", {"title": "Quiz 2 on Monday", "content": "Chapters 3-4.", "sectionId": c1}, tt)
    r.case("ANN-03", "Announcements", "Teacher must choose one of their classes", 400, "POST", "/announcements", {"title": "General", "content": "Hi all"}, tt)
    r.case("ANN-04", "Announcements", "Teacher cannot post to another teacher's class", 403, "POST", "/announcements", {"title": "Hello class", "content": "Y", "sectionId": c2}, tt)
    r.case("ANN-05", "Announcements", "Unknown priority is rejected", 400, "POST", "/announcements", {"title": "Hello all", "content": "Y", "priority": "panic"}, at)
    r.case("ANN-06", "Announcements", "Student cannot post", 403, "POST", "/announcements", {"title": "Hello class", "content": "Y", "sectionId": c1}, s1["token"])
    r.case("ANN-07", "Announcements", "Student sees the broadcast and their class post", 200, "GET", "/announcements", token=s1["token"], check=lambda b: expect(len(b) == 2, b))
    r.case("ANN-08", "Announcements", "Teacher 2 sees only the broadcast", 200, "GET", "/announcements", token=t2t, check=lambda b: expect(len(b) == 1, b))
    nb = r.case("NTF-01", "Notifications", "Student lists their notifications", 200, "GET", "/notifications", token=s1["token"],
                check=lambda b: expect(len(b) >= 3, b))
    r.case("NTF-02", "Notifications", "Student marks one as read", 200, "POST", f"/notifications/{nb[0]['id']}/read", token=s1["token"], check=lambda b: expect(b["status"] == "read", b))
    r.case("NTF-03", "Notifications", "Someone else's notification is not found", 404, "POST", f"/notifications/{nb[0]['id']}/read", token=s2["token"])
    r.case("NTF-04", "Notifications", "Mark all as read", 200, "POST", "/notifications/read-all", token=s1["token"])
    r.case("NTF-05", "Notifications", "Clear all", 200, "DELETE", "/notifications", token=s1["token"])
    r.case("NTF-06", "Notifications", "List is empty after clearing", 200, "GET", "/notifications", token=s1["token"], check=lambda b: expect(b == [], b))
    r.case("NTF-07", "Notifications", "Notifications need a login", 401, "GET", "/notifications")

    # ---------- 4.3 Forgot password ----------
    r.case("FPW-01", "Forgot Password", "Verify: ID of an active account is valid", 200, "POST", "/auth/forgot-password/verify", {"idNumber": s3["idNumber"]},
           check=lambda b: expect(b["valid"] and b["firstName"] == "Carlo", b))
    r.case("FPW-02", "Forgot Password", "Verify: unknown ID is not valid", 200, "POST", "/auth/forgot-password/verify", {"idNumber": "1999000000"},
           check=lambda b: expect(b["valid"] is False, b))
    r.case("FPW-03", "Forgot Password", "Reset with a short password is rejected", 400, "POST", "/auth/forgot-password/reset", {"idNumber": s3["idNumber"], "password": "short"})
    r.case("FPW-04", "Forgot Password", "Reset with an unknown ID is rejected", 400, "POST", "/auth/forgot-password/reset", {"idNumber": "1999000000", "password": "NewPass123"})
    r.case("FPW-05", "Forgot Password", "Reset sets the new password", 200, "POST", "/auth/forgot-password/reset", {"idNumber": s3["idNumber"], "password": "NewPass123"})
    r.case("FPW-06", "Forgot Password", "Old password no longer works", 401, "POST", "/auth/login", {"email": "carlo@test.com", "password": pw})
    r.case("FPW-07", "Forgot Password", "New password works", 200, "POST", "/auth/login", {"email": "carlo@test.com", "password": "NewPass123"})

    # ---------- 4.2 Lockout ----------
    for i in range(4):
        call("POST", "/auth/login", {"email": "ana@test.com", "password": "wrong"})
    r.case("AUTH-11", "Auth", "5th wrong password locks the account", 423, "POST", "/auth/login", {"email": "ana@test.com", "password": "wrong"})
    r.case("AUTH-12", "Auth", "Locked account refuses even the right password", 423, "POST", "/auth/login", {"email": "ana@test.com", "password": pw})

    # ---------- 13.x Audit logs ----------
    r.case("AUD-01", "Audit Logs", "Admin reads the audit trail", 200, "GET", "/auditlogs", token=at,
           check=lambda b: expect({"PASSWORD_RESET", "GRADE_CHANGED", "CLASS_CREATED", "CLASS_UPDATED"} <= {x["action"] for x in b}, [x["action"] for x in b]))
    r.case("AUD-02", "Audit Logs", "Teacher cannot read the audit trail", 403, "GET", "/auditlogs", token=tt)

    # ---------- 8.6 End semester ----------
    r.case("END-01", "End Semester", "Teacher ends the semester", 200, "POST", f"/classes/{c1}/end-semester", token=tt,
           check=lambda b: expect(b["status"] == "completed", b))
    r.case("END-02", "End Semester", "Ending again is rejected", 400, "POST", f"/classes/{c1}/end-semester", token=tt)
    r.case("END-03", "End Semester", "No enrolling after the class ended", 400, "POST", f"/classes/{c1}/enroll", {"studentIds": [s1["id"]]}, tt)
    r.case("END-04", "End Semester", "No new assessments after the class ended", 400, "POST", "/assessments", {"sectionId": c1, "title": "Late", "type": "Quiz", "perfectScore": 10}, tt)
    r.case("END-05", "End Semester", "Grades are final after the class ended", 400, "POST", f"/assessments/{q1}/scores", {"scores": [{"studentId": s1["id"], "score": 20}]}, tt)
    r.case("END-06", "End Semester", "Weights are final after the class ended", 400, "PUT", f"/classes/{c1}/weights", {"Quiz": 50, "Project": 50}, tt)
    r.case("END-08", "End Semester", "Class details are final after the class ended", 400, "PUT", f"/classes/{c1}", upd, tt)
    r.case("END-07", "End Semester", "Students get their final grade", 200, "GET", "/notifications", token=s2["token"],
           check=lambda b: expect(any(n["title"] == "Final grade posted" for n in b), [n["title"] for n in b]))


def main():
    label = sys.argv[1] if len(sys.argv) > 1 else "run"
    build_dir = os.path.join(os.environ.get("TEMP", "/tmp"), f"edutrack_api_test_{label}")
    print(f"Resetting test database '{TEST_DB}' ...")
    reset_test_database()
    print("Building and starting the API on port", PORT, "...")
    proc = start_api(build_dir)
    r = Runner()
    try:
        run_cases(r)
    finally:
        proc.kill()
    passed = sum(x["pass"] for x in r.results)
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f"{label}.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"label": label, "date": dt.datetime.now().isoformat(timespec="seconds"), "total": len(r.results),
                   "passed": passed, "results": r.results}, f, indent=2, ensure_ascii=False)
    print(f"\n{passed}/{len(r.results)} passed. Results: {out}")
    sys.exit(0 if passed == len(r.results) else 1)


if __name__ == "__main__":
    main()

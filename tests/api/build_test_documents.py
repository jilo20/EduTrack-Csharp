"""
Builds the Unit Test Cases (UTC) and Unit Test Results (UTR) workbooks from one API test run.

Usage (after python tests/api/run_api_tests.py <label>):
  python tests/api/build_test_documents.py tests/api/results/<label>.json <output folder> [tested-by]

Writes UTC_Group3_EduTrack.xlsx and UTR_Group3_EduTrack.xlsx (names from the Project Plan, slide 17).
The UTR summary uses formulas, so it recalculates if a result is edited by hand (e.g. after a retest).
"""
import datetime as dt
import json
import os
import subprocess
import sys

from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

PROJECT = "EduTrack - Students Performance Tracker"
GROUP = "Group 3"
RED = "C00000"
FONT = "Arial"

WBS = {
    "Auth": "4.1, 4.2, 4.5", "Register": "4.4", "Forgot Password": "4.3", "Invites": "5.1", "Users": "6.1 - 6.3",
    "Classes": "7.1 - 7.3", "Weights": "7.4", "Assessments": "8.1", "Scores": "8.2", "Reports": "8.4, 8.5",
    "End Semester": "8.6", "Attendance": "9.1, 9.2", "Student": "10.1 - 10.3", "Analytics": "11.1 - 11.3",
    "Announcements": "12.1", "Notifications": "12.2", "Audit Logs": "13.1, 13.2",
}
PRECONDITION = {
    "Auth": "API running; the default Admin account is seeded on startup.",
    "Invites": "Logged in as Admin.",
    "Register": "Unused Teacher and Student invite IDs exist (INV-01 to INV-05).",
    "Users": "Teacher and student accounts are registered (REG-01 to REG-08).",
    "Classes": "Two active teachers and three active students exist.",
    "Weights": "Class IT301-A (Maria Santos) and IT201-A (Jose Ramos) exist.",
    "Assessments": "Class IT301-A exists with 3 enrolled students (CLS-14).",
    "Scores": "Assessments Quiz 1 (20 pts) and Midterm Project (50 pts) exist in IT301-A.",
    "Attendance": "Class IT301-A has 3 enrolled students.",
    "Reports": "Scores and attendance are recorded for IT301-A.",
    "Student": "The student is enrolled in IT301-A with scores and attendance.",
    "Analytics": "Classes, scores and attendance are recorded.",
    "Announcements": "Class IT301-A exists with enrolled students.",
    "Notifications": "The student has notifications from enrollment and announcements.",
    "Forgot Password": "Student Carlo Mendoza exists and is active.",
    "Audit Logs": "The actions in the earlier cases were performed.",
    "End Semester": "Class IT301-A is active with grades recorded.",
}
STATUS_TEXT = {
    200: "200 OK", 201: "201 Created", 400: "400 Bad Request", 401: "401 Unauthorized", 403: "403 Forbidden",
    404: "404 Not Found", 409: "409 Conflict", 423: "423 Locked",
}
EXPECTED_TEXT = {
    200: "The request succeeds (200 OK) and returns the expected data.",
    201: "The record is created (201 Created) and returned.",
    400: "The request is rejected (400 Bad Request) with a validation or rule message.",
    401: "The request is refused (401 Unauthorized): not logged in or wrong credentials.",
    403: "The request is refused (403 Forbidden): the account is not allowed to do this.",
    404: "The request is refused (404 Not Found): the record does not exist.",
    409: "The request is refused (409 Conflict): the value is already used.",
    423: "The request is refused (423 Locked): the account is locked.",
}

thin = Side(style="thin", color="BFBFBF")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP_TOP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(horizontal="center", vertical="top", wrap_text=True)


def font(**kw):
    return Font(name=FONT, size=kw.pop("size", 10), **kw)


def header_row(ws, row, headers, widths):
    for i, (h, w) in enumerate(zip(headers, widths), start=1):
        c = ws.cell(row=row, column=i, value=h)
        c.font = font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor=RED)
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BORDER
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[row].height = 30


def title_block(ws, doc_title, run):
    ws["A1"] = PROJECT
    ws["A1"].font = font(bold=True, size=14, color=RED)
    ws["A2"] = f"{doc_title} - {GROUP}"
    ws["A2"].font = font(bold=True, size=12)
    ws["A3"] = f"Test run: {run['date'][:10]}  |  {run['total']} test cases  |  Source: tests/api/run_api_tests.py"
    ws["A3"].font = font(color="595959")


def cover(wb, doc_title, purpose, run, tested_by, commit):
    ws = wb.active
    ws.title = "Cover"
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 90
    ws["A1"] = PROJECT
    ws["A1"].font = font(bold=True, size=16, color=RED)
    ws["A2"] = doc_title
    ws["A2"].font = font(bold=True, size=14)
    rows = [
        ("Group", GROUP),
        ("Document", doc_title),
        ("Version", "1.00"),
        ("Date", run["date"][:10]),
        ("Prepared by", tested_by),
        ("Purpose", purpose),
        ("Scope", "Every endpoint of the EduTrack C# Web API (Controller -> Service -> Repository), including role "
                  "permissions, validation errors and business rules. Page-level UI tests are not part of this document."),
        ("Test environment", "ASP.NET Core Web API (.NET 10) on http://localhost:5099, MySQL 8 test database "
                             "'edutrack_test' (dropped and recreated for every run)."),
        ("Code version", f"Git commit {commit} (github.com/jilo20/EduTrack-Csharp)"),
        ("How to run", "python tests/api/run_api_tests.py <label>, then "
                       "python tests/api/build_test_documents.py tests/api/results/<label>.json <folder>"),
    ]
    for i, (k, v) in enumerate(rows, start=4):
        ws.cell(row=i, column=1, value=k).font = font(bold=True)
        c = ws.cell(row=i, column=2, value=v)
        c.font = font()
        c.alignment = WRAP_TOP
    # Revision history
    rh = wb.create_sheet("Revision History")
    header_row(rh, 1, ["Rev No.", "Modified By", "Modified Date", "Remarks", "Reviewed By", "Date Reviewed", "Approved By", "Date Approved"],
               [9, 22, 15, 60, 20, 15, 20, 15])
    for col, v in enumerate(["1.00", tested_by, run["date"][:10], "Initial creation", "", "", "", ""], start=1):
        c = rh.cell(row=2, column=col, value=v)
        c.font = font()
        c.border = BORDER
        c.alignment = WRAP_TOP


def steps(r):
    who = r["actor"]
    call = f"{r['method']} /api{r['path']}"
    if who == "Not logged in":
        return f"1. Without logging in, send {call}" + (" with the test data." if r["request"] is not None else ".") + "\n2. Check the response."
    return (f"1. Log in as {who}.\n2. Send {call}" + (" with the test data." if r["request"] is not None else ".")
            + "\n3. Check the response.")


def test_data(r):
    return "-" if r["request"] is None else json.dumps(r["request"], ensure_ascii=False)


def actual_text(r):
    text = STATUS_TEXT.get(r["actual"], str(r["actual"]))
    body = r["body"]
    if isinstance(body, dict) and isinstance(body.get("error"), str):
        return f"{text}: \"{body['error']}\""
    if isinstance(body, dict) and isinstance(body.get("errors"), dict):
        msgs = [m for v in body["errors"].values() for m in v]
        return f"{text}: \"{msgs[0]}\"" if msgs else text
    if isinstance(body, list):
        return f"{text}: {len(body)} record(s) returned."
    return f"{text}."


def build_utc(run, out, tested_by, commit):
    wb = Workbook()
    cover(wb, "Unit Test Cases (UTC)",
          "Lists every unit test case for the EduTrack API: what is tested, the preconditions, steps, test data and expected result.",
          run, tested_by, commit)
    ws = wb.create_sheet("Test Cases")
    title_block(ws, "Unit Test Cases (UTC)", run)
    headers = ["No.", "Test Case ID", "Module", "WBS", "Test Scenario", "Type", "Pre-condition", "Test Steps", "Test Data", "Expected Result"]
    header_row(ws, 5, headers, [8, 15, 16, 12, 42, 11, 34, 46, 46, 40])
    for n, r in enumerate(run["results"], start=1):
        row = 5 + n
        vals = [n, r["id"], r["module"], WBS.get(r["module"], ""), r["title"],
                "Positive" if r["expected"] in (200, 201) else "Negative",
                PRECONDITION.get(r["module"], ""), steps(r), test_data(r), EXPECTED_TEXT.get(r["expected"], str(r["expected"]))]
        for col, v in enumerate(vals, start=1):
            c = ws.cell(row=row, column=col, value=v)
            c.font = font()
            c.border = BORDER
            c.alignment = CENTER if col in (1, 2, 4, 6) else WRAP_TOP
    ws.freeze_panes = "C6"
    ws.auto_filter.ref = f"A5:{get_column_letter(len(headers))}{5 + len(run['results'])}"
    path = os.path.join(out, "UTC_Group3_EduTrack.xlsx")
    wb.save(path)
    return path


def build_utr(run, out, tested_by, commit):
    wb = Workbook()
    cover(wb, "Unit Test Results (UTR)",
          "Records the result of running every unit test case in UTC_Group3_EduTrack.xlsx: actual result, pass / fail, date and tester.",
          run, tested_by, commit)
    summary = wb.create_sheet("Summary")
    ws = wb.create_sheet("Test Results")
    title_block(ws, "Unit Test Results (UTR)", run)
    headers = ["No.", "Test Case ID", "Module", "Test Scenario", "Expected Result", "Actual Result", "Status", "Date Tested", "Tested By", "Remarks"]
    header_row(ws, 5, headers, [8, 15, 16, 42, 40, 50, 11, 15, 20, 30])
    first, last = 6, 5 + len(run["results"])
    date = dt.date.fromisoformat(run["date"][:10])
    for n, r in enumerate(run["results"], start=1):
        row = 5 + n
        vals = [n, r["id"], r["module"], r["title"], EXPECTED_TEXT.get(r["expected"], str(r["expected"])), actual_text(r),
                "Pass" if r["pass"] else "Fail", date, tested_by, "" if r["pass"] else (r["note"] or "Status differs from expected")]
        for col, v in enumerate(vals, start=1):
            c = ws.cell(row=row, column=col, value=v)
            c.font = font(bold=(col == 7))
            c.border = BORDER
            c.alignment = CENTER if col in (1, 2, 7, 8) else WRAP_TOP
        ws.cell(row=row, column=8).number_format = "yyyy-mm-dd"
    status_range = f"G{first}:G{last}"
    ws.conditional_formatting.add(status_range, CellIsRule(operator="equal", formula=['"Pass"'], fill=PatternFill("solid", fgColor="C6EFCE"), font=Font(name=FONT, bold=True, color="006100")))
    ws.conditional_formatting.add(status_range, CellIsRule(operator="equal", formula=['"Fail"'], fill=PatternFill("solid", fgColor="FFC7CE"), font=Font(name=FONT, bold=True, color="9C0006")))
    ws.freeze_panes = "C6"
    ws.auto_filter.ref = f"A5:{get_column_letter(len(headers))}{last}"

    # Summary with formulas over the Test Results sheet
    title_block(summary, "Unit Test Results (UTR) - Summary", run)
    tr = "'Test Results'"
    labels = [("Total test cases", f"=COUNTA({tr}!B{first}:B{last})"),
              ("Passed", f"=COUNTIF({tr}!G{first}:G{last},\"Pass\")"),
              ("Failed", f"=COUNTIF({tr}!G{first}:G{last},\"Fail\")"),
              ("Pass rate", "=IF(B5=0,0,B6/B5)")]
    for i, (k, f) in enumerate(labels, start=5):
        summary.cell(row=i, column=1, value=k).font = font(bold=True)
        c = summary.cell(row=i, column=2, value=f)
        c.font = font(bold=True)
        c.alignment = Alignment(horizontal="right")
    summary["B8"].number_format = "0.0%"
    summary.cell(row=10, column=1, value="Date tested").font = font(bold=True)
    summary.cell(row=10, column=2, value=date).number_format = "yyyy-mm-dd"
    summary.cell(row=11, column=1, value="Tested by").font = font(bold=True)
    summary.cell(row=11, column=2, value=tested_by)
    summary.cell(row=12, column=1, value="Code version").font = font(bold=True)
    summary.cell(row=12, column=2, value=f"Git commit {commit}")
    summary.cell(row=13, column=1, value="Environment").font = font(bold=True)
    summary.cell(row=13, column=2, value="API on localhost:5099, MySQL 8 database edutrack_test (recreated each run)")
    for rr in range(10, 14):
        summary.cell(row=rr, column=2).font = font()
        summary.cell(row=rr, column=2).alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        summary.merge_cells(start_row=rr, start_column=2, end_row=rr, end_column=6)
    summary.row_dimensions[13].height = 28

    header_row(summary, 15, ["Module", "WBS", "Total", "Passed", "Failed", "Pass rate"], [26, 14, 10, 10, 10, 12])
    summary.column_dimensions["A"].width = 26
    summary.column_dimensions["B"].width = 18
    modules = list(dict.fromkeys(r["module"] for r in run["results"]))
    for i, m in enumerate(modules, start=16):
        vals = [m, WBS.get(m, ""),
                f"=COUNTIF({tr}!C{first}:C{last},A{i})",
                f"=COUNTIFS({tr}!C{first}:C{last},A{i},{tr}!G{first}:G{last},\"Pass\")",
                f"=COUNTIFS({tr}!C{first}:C{last},A{i},{tr}!G{first}:G{last},\"Fail\")",
                f"=IF(C{i}=0,0,D{i}/C{i})"]
        for col, v in enumerate(vals, start=1):
            c = summary.cell(row=i, column=col, value=v)
            c.font = font()
            c.border = BORDER
            c.alignment = Alignment(horizontal="left" if col <= 2 else "center")
        summary.cell(row=i, column=6).number_format = "0.0%"
    total_row = 16 + len(modules)
    for col, v in enumerate(["Total", "", f"=SUM(C16:C{total_row - 1})", f"=SUM(D16:D{total_row - 1})",
                             f"=SUM(E16:E{total_row - 1})", f"=IF(C{total_row}=0,0,D{total_row}/C{total_row})"], start=1):
        c = summary.cell(row=total_row, column=col, value=v)
        c.font = font(bold=True)
        c.border = BORDER
        c.alignment = Alignment(horizontal="left" if col <= 2 else "center")
    summary.cell(row=total_row, column=6).number_format = "0.0%"
    path = os.path.join(out, "UTR_Group3_EduTrack.xlsx")
    wb.save(path)
    return path


def main():
    results_file, out = sys.argv[1], sys.argv[2]
    tested_by = sys.argv[3] if len(sys.argv) > 3 else "Bazar, Angelo R."
    with open(results_file, encoding="utf-8") as f:
        run = json.load(f)
    try:
        commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True,
                                cwd=os.path.dirname(os.path.abspath(__file__))).stdout.strip() or "unknown"
    except OSError:
        commit = "unknown"
    os.makedirs(out, exist_ok=True)
    print(build_utc(run, out, tested_by, commit))
    print(build_utr(run, out, tested_by, commit))


if __name__ == "__main__":
    main()

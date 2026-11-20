// OWNER: Lopez, Mary Vincent — WBS 8.8 Reports & Export
import { useCallback, useState } from 'react';
import { Alert, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { endSemester, getClassReport, getStudentReport } from '../../api/assessments';
import FeatureDataState from '../../components/common/FeatureDataState';
import { displayNumber, useFeatureData, useTeachingClasses } from '../../components/common/featureData';
import { downloadCsv, downloadPdf } from './reportExport';

export default function ReportsPage() {
  const classes = useTeachingClasses();
  const [classId, setClassId] = useState('');
  const section = classes.data?.find((c) => c.id === Number(classId));
  return <Stack spacing={3}>
    <Typography variant="h4">Reports & Export</Typography>
    <FeatureDataState {...classes} onRetry={classes.refresh} empty={classes.data?.length === 0} emptyMessage="You have no classes yet.">
      <TextField select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}>{(classes.data || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.sectionCode})</MenuItem>)}</TextField>
      {section ? <ClassReport key={section.id} section={section} /> : <Alert severity="info">Select a class to view reports.</Alert>}
    </FeatureDataState>
  </Stack>;
}

function ClassReport({ section }) {
  const loader = useCallback(() => getClassReport(section.id), [section.id]);
  const resource = useFeatureData(loader);
  return <FeatureDataState {...resource} onRetry={resource.refresh}>
    {resource.data && <ReportContent section={section} initialReport={resource.data} />}
  </FeatureDataState>;
}

function ReportContent({ section, initialReport }) {
  const [report, setReport] = useState(initialReport);
  const [studentId, setStudentId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const completed = report.status === 'completed' || section.status === 'completed';
  const headers = ['Student', 'Email', 'Grade (%)', 'Equivalent grade', 'Attendance (%)'];
  const rows = (report.students || []).map((s) => [s.name, s.email, s.grade, s.equivalentGrade, s.attendanceRate]);
  // Mock responses use a fixed sample class label; use the selected class for the heading.
  const title = section.name + ' (' + section.sectionCode + ')';
  const summary = 'Class average: ' + displayNumber(report.classAverage, '%') + ' | Passing: ' + report.passingCount + '/' + report.totalStudents + ' | Attendance: ' + displayNumber(report.attendanceRate, '%');
  const csvRows = [...rows, [], ['Summary', 'Value'], ['Class', title], ['Class average (%)', report.classAverage], ['Passing students', report.passingCount], ['Total students', report.totalStudents], ['Attendance (%)', report.attendanceRate]];
  async function exportPdf() {
    setBusy(true); setError('');
    try { await downloadPdf('class-' + section.id + '.pdf', title, summary, [{ headers, rows }]); }
    catch (e) { setError('PDF export failed: ' + e.message); }
    finally { setBusy(false); }
  }
  async function finishSemester() {
    setBusy(true); setError('');
    try { setReport(await endSemester(section.id)); setConfirm(false); setNotice('Semester ended. Final grades are now available.'); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <Stack spacing={2}>
    <Typography variant="h6">{title}</Typography>
    {error && !confirm && <Alert severity="error">{error}</Alert>}
    {notice && <Alert severity="success">{notice}</Alert>}
    {completed && <Alert severity="info">Semester completed. These are the final results.</Alert>}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      {[['Class average', displayNumber(report.classAverage, '%')], ['Passing students', report.passingCount + ' / ' + report.totalStudents], ['Attendance rate', displayNumber(report.attendanceRate, '%')]].map(([label, value]) =>
        <Card key={label} variant="outlined" sx={{ flex: 1 }}><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h5">{value}</Typography></CardContent></Card>)}
    </Stack>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button variant="outlined" disabled={busy} onClick={() => downloadCsv('class-' + section.id + '.csv', headers, csvRows)}>Export CSV</Button>
      <Button variant="outlined" disabled={busy} onClick={exportPdf}>Export PDF</Button>
      <Button color="warning" variant="contained" disabled={busy || completed} onClick={() => { setError(''); setConfirm(true); }}>End semester</Button>
    </Stack>
    <FeatureDataState empty={!rows.length} emptyMessage="No students are enrolled in this class.">
      <TableContainer component={Paper}><Table aria-label="Class report"><TableHead><TableRow>{['Student', 'Grade', 'Equivalent', 'Attendance', 'Report'].map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>{(report.students || []).map((s) => <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{displayNumber(s.grade, '%')}</TableCell><TableCell>{displayNumber(s.equivalentGrade)}</TableCell><TableCell>{displayNumber(s.attendanceRate, '%')}</TableCell><TableCell><Button onClick={() => setStudentId(s.id)}>View {s.name}</Button></TableCell></TableRow>)}</TableBody>
      </Table></TableContainer>
    </FeatureDataState>
    <Dialog open={confirm} onClose={() => { if (!busy) setConfirm(false); }} fullWidth maxWidth="sm">
      <DialogTitle>End semester for {section.sectionCode}?</DialogTitle><DialogContent><Stack spacing={2}>{error && <Alert severity="error">{error}</Alert>}<Typography>This finalizes grades, locks grading and attendance, and notifies students and admins. This cannot be undone.</Typography></Stack></DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setConfirm(false)}>Cancel</Button><Button variant="contained" color="warning" disabled={busy} onClick={finishSemester}>{busy ? 'Finalizing…' : 'Confirm end semester'}</Button></DialogActions>
    </Dialog>
    <Dialog open={studentId != null} onClose={() => setStudentId(null)} fullWidth maxWidth="md"><DialogTitle>Student report</DialogTitle><DialogContent>{studentId != null && <StudentReport key={studentId} classId={section.id} studentId={studentId} studentName={report.students?.find((s) => s.id === studentId)?.name} className={title} />}</DialogContent><DialogActions><Button onClick={() => setStudentId(null)}>Close</Button></DialogActions></Dialog>
  </Stack>;
}

function StudentReport({ classId, studentId, studentName, className }) {
  const loader = useCallback(() => getStudentReport(classId, studentId), [classId, studentId]);
  const resource = useFeatureData(loader);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const report = resource.data;
  const headers = ['Assessment', 'Category', 'Score', 'Perfect score'];
  const rows = (report?.scores || []).map((s) => [s.assessment, s.type, s.score, s.perfectScore]);
  const categoryHeaders = ['Category', 'Average (%)', 'Weight (%)'];
  const categoryRows = (report?.categories || []).map((c) => [c.type, c.average, c.weight]);
  const title = (studentName || report?.student?.name || 'Student') + ' · ' + className;
  const summary = 'Grade: ' + displayNumber(report?.grade, '%') + ' | Equivalent: ' + displayNumber(report?.equivalentGrade) + ' | Attendance: ' + displayNumber(report?.attendance?.rate, '%');
  const csvRows = [...rows, [], categoryHeaders, ...categoryRows, [], ['Summary', 'Value'], ['Student', studentName || report?.student?.name], ['Class', className], ['Grade (%)', report?.grade], ['Equivalent grade', report?.equivalentGrade], ['Attendance (%)', report?.attendance?.rate]];
  async function exportPdf() {
    setBusy(true); setError('');
    try { await downloadPdf('student-' + studentId + '-class-' + classId + '.pdf', title, summary, [{ headers, rows }, { headers: categoryHeaders, rows: categoryRows }]); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <FeatureDataState {...resource} onRetry={resource.refresh}>
    {report && <Stack spacing={2} sx={{ pt: 1 }}>
      <Typography variant="h6">{studentName || report.student?.name}</Typography><Typography>{summary}</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction="row" spacing={1}><Button disabled={busy} onClick={() => downloadCsv('student-' + studentId + '.csv', headers, csvRows)}>Export CSV</Button><Button disabled={busy} onClick={exportPdf}>Export PDF</Button></Stack>
      <TableContainer><Table aria-label="Student scores"><TableHead><TableRow>{headers.map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map((row, i) => <TableRow key={i}>{row.map((v, j) => <TableCell key={j}>{v ?? 'Pending'}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>
      <TableContainer><Table aria-label="Category breakdown"><TableHead><TableRow>{categoryHeaders.map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead><TableBody>{categoryRows.map((row) => <TableRow key={row[0]}>{row.map((v, j) => <TableCell key={j}>{v ?? 'Pending'}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>
    </Stack>}
  </FeatureDataState>;
}

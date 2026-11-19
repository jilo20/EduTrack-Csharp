// OWNER: Lopez, Mary Vincent — WBS 9.3 Attendance Manager
import { useCallback, useState } from 'react';
import { Alert, Button, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { getClassAttendance, markAttendance } from '../../api/attendance';
import FeatureDataState from '../../components/common/FeatureDataState';
import { localDate, useFeatureData, useTeachingClasses } from '../../components/common/featureData';

const statuses = ['Present', 'Late', 'Absent', 'No Class'];
export default function AttendanceManagerPage() {
  const classes = useTeachingClasses();
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(localDate);
  const section = classes.data?.find((c) => c.id === Number(classId));
  return <Stack spacing={3}>
    <Typography variant="h4">Attendance Manager</Typography>
    <Typography color="text.secondary">Choose a date to review or update attendance. Late counts as half a day; No Class is excluded from attendance rates.</Typography>
    <FeatureDataState {...classes} onRetry={classes.refresh} empty={classes.data?.length === 0} emptyMessage="You have no classes yet.">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField select label="Class" value={classId} sx={{ flex: 1, minWidth: 0 }} onChange={(e) => setClassId(e.target.value)}>{(classes.data || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.sectionCode})</MenuItem>)}</TextField>
        <TextField type="date" label="Attendance date" value={date} sx={{ width: { xs: '100%', sm: 240 }, flexShrink: 0 }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: localDate() } }} onChange={(e) => setDate(e.target.value)} />
      </Stack>
      {!date || date > localDate() ? <Alert severity="warning">Choose today or a past date.</Alert> :
        section ? <AttendanceDay key={section.id + ':' + date} section={section} date={date} /> : <Alert severity="info">Select a class to view attendance.</Alert>}
    </FeatureDataState>
  </Stack>;
}

function AttendanceDay({ section, date }) {
  const loader = useCallback(() => getClassAttendance(section.id, date), [section.id, date]);
  const resource = useFeatureData(loader);
  return <FeatureDataState {...resource} onRetry={resource.refresh} empty={resource.data?.length === 0} emptyMessage="No students are enrolled in this class.">
    {resource.data && <AttendanceEditor section={section} date={date} initialRows={resource.data} />}
  </FeatureDataState>;
}

function AttendanceEditor({ section, date, initialRows }) {
  const [rows, setRows] = useState(initialRows.map((r) => ({ ...r, status: r.status || '', remarks: r.remarks || '' })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const completed = section.status === 'completed';
  const unmarked = rows.filter((r) => !r.status).length;
  function update(id, key, value) {
    setNotice(''); setRows((previous) => previous.map((r) => r.studentId === id ? { ...r, [key]: value } : r));
  }
  function markAll(status) {
    setNotice(''); setRows((previous) => previous.map((r) => ({ ...r, status })));
  }
  async function save() {
    setError(''); setNotice('');
    if (unmarked) { setError('Choose a status for every student before saving.'); return; }
    setSaving(true);
    try {
      await markAttendance({ sectionId: section.id, date, records: rows.map((r) => ({ studentId: r.studentId, status: r.status, remarks: r.remarks.trim() })) });
      setNotice('Attendance saved for ' + date + '.');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }
  return <Stack spacing={2}>
    {completed && <Alert severity="info">This semester has ended. Attendance is read-only.</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    {notice && <Alert severity="success">{notice}</Alert>}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button variant="outlined" disabled={completed || saving} onClick={() => markAll('Present')}>Mark all present</Button>
      <Button variant="outlined" disabled={completed || saving} onClick={() => markAll('No Class')}>Mark day as No Class</Button>
    </Stack>
    <TableContainer component={Paper}><Table aria-label="Class attendance"><TableHead><TableRow><TableCell>Student</TableCell><TableCell>Status</TableCell><TableCell>Remarks</TableCell></TableRow></TableHead>
      <TableBody>{rows.map((r) => <TableRow key={r.studentId}><TableCell>{r.studentName}</TableCell><TableCell>
        <TextField select size="small" label={`Status for ${r.studentName}`} value={r.status} disabled={completed || saving} sx={{ minWidth: 175 }} onChange={(e) => update(r.studentId, 'status', e.target.value)}>{statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
      </TableCell><TableCell><TextField size="small" label={`Remarks for ${r.studentName}`} value={r.remarks} disabled={completed || saving} slotProps={{ htmlInput: { maxLength: 200 } }} onChange={(e) => update(r.studentId, 'remarks', e.target.value)} /></TableCell></TableRow>)}</TableBody>
    </Table></TableContainer>
    {unmarked > 0 && <Typography color="text.secondary">{unmarked} student(s) still need a status.</Typography>}
    <Button variant="contained" disabled={completed || saving || !!unmarked} onClick={save}>{saving ? 'Saving…' : 'Save attendance'}</Button>
  </Stack>;
}

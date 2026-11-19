// OWNER: Lopez, Mary Vincent — WBS 9.4 My Attendance
import { useCallback, useState } from 'react';
import { Alert, Chip, Paper, Stack, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { getCurrentUser } from '../../api/client';
import { getStudentAttendance } from '../../api/attendance';
import FeatureDataState from '../../components/common/FeatureDataState';
import { displayNumber, useFeatureData } from '../../components/common/featureData';

const statusColors = { Present: 'success', Late: 'warning', Absent: 'error', 'No Class': 'default' };
export default function MyAttendancePage() {
  const studentId = getCurrentUser()?.id;
  const loader = useCallback(() => {
    if (!studentId) throw new Error('Sign in again to view your attendance.');
    return getStudentAttendance(studentId);
  }, [studentId]);
  const resource = useFeatureData(loader);
  const [classId, setClassId] = useState(null);
  const classes = resource.data?.classes || [];
  const selected = classes.find((c) => c.classId === classId) || classes[0];
  return <Stack spacing={3}>
    <Typography variant="h4">My Attendance</Typography>
    <FeatureDataState {...resource} onRetry={resource.refresh} empty={resource.data && !classes.length} emptyMessage="You are not enrolled in any classes yet.">
      <Paper variant="outlined" sx={{ p: 3 }}><Typography color="text.secondary">Overall attendance rate</Typography><Typography variant="h4">{displayNumber(resource.data?.rate, '%')}</Typography><Typography variant="body2" color="text.secondary">Present counts as one day, Late as half a day. No Class days are excluded.</Typography></Paper>
      <Tabs value={selected?.classId ?? false} onChange={(_, id) => setClassId(id)} variant="scrollable" scrollButtons="auto" aria-label="Attendance by class">{classes.map((c) => <Tab key={c.classId} value={c.classId} label={c.className} />)}</Tabs>
      {selected && <Stack spacing={2}>
        <Typography variant="h6">{selected.className} · {displayNumber(selected.rate, '%')}</Typography>
        {selected.rate == null && <Alert severity="info">No attendance rate is available until a class day has been recorded.</Alert>}
        <FeatureDataState empty={!selected.records?.length} emptyMessage="No attendance has been recorded for this class.">
          <TableContainer component={Paper}><Table aria-label="My attendance records"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>Remarks</TableCell></TableRow></TableHead>
            <TableBody>{[...(selected.records || [])].sort((a, b) => b.date.localeCompare(a.date)).map((r) => <TableRow key={r.date}><TableCell>{r.date}</TableCell><TableCell><Chip size="small" color={statusColors[r.status] || 'default'} label={r.status} /></TableCell><TableCell>{r.remarks || '—'}</TableCell></TableRow>)}</TableBody>
          </Table></TableContainer>
        </FeatureDataState>
      </Stack>}
    </FeatureDataState>
  </Stack>;
}

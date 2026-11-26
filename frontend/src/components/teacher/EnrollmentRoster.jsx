import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import { displayLabel } from '../../theme';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { enrollStudents, getRoster } from '../../api/classes';
import { getUsers } from '../../api/users';

const asKey = (id) => String(id);
const studentName = (student) => student?.name || [student?.firstName, student?.lastName].filter(Boolean).join(' ') || 'Student';
const studentIdLabel = (student) => student?.idNumber || student?.studentId || '';

function mergeById(...groups) {
  const students = new Map();
  groups.flat().filter(Boolean).forEach((student) => students.set(asKey(student.id), student));
  return [...students.values()];
}

function friendlyError(error, fallback) {
  const message = error instanceof Error ? error.message : '';
  if (/\b401\b|unauthori[sz]ed/i.test(message)) return 'Your session may have expired. Sign in again and retry.';
  return fallback;
}

export default function EnrollmentRoster({ open = false, selectedClass = null, onClose }) {
  const classId = selectedClass?.id;
  const [roster, setRoster] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const localEnrollments = useRef(new Map());
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [rosterLoading, setRosterLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rosterError, setRosterError] = useState('');
  const [studentsError, setStudentsError] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadRoster = useCallback(async () => {
    if (classId == null) {
      setRosterError('Select a class before viewing its roster.');
      return;
    }
    setRosterLoading(true);
    setRosterError('');
    try {
      const response = await getRoster(classId);
      const serverStudents = Array.isArray(response?.students) ? response.students : [];
      setRoster(mergeById(serverStudents, localEnrollments.current.get(asKey(classId)) ?? []));
    } catch (error) {
      setRosterError(friendlyError(error, 'We could not load this class roster. Please try again.'));
    } finally {
      setRosterLoading(false);
    }
  }, [classId]);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError('');
    try {
      const response = await getUsers('Student');
      const students = Array.isArray(response) ? response : [];
      setAvailableStudents(students.filter((student) => String(student.status ?? 'active').toLowerCase() === 'active'));
    } catch (error) {
      setStudentsError(friendlyError(error, 'We could not load eligible students. Please try again.'));
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
    setSearch('');
    setEnrollError('');
    setSuccessMessage('');
    setRoster([]);
    setRosterError('');
    if (classId == null) {
      setRoster([]);
      setRosterError('Select a class before viewing its roster.');
      setAvailableStudents([]);
      return;
    }
    loadRoster();
    loadStudents();
  }, [open, classId, loadRoster, loadStudents]);

  const enrolledIds = useMemo(() => new Set(roster.map((student) => asKey(student.id))), [roster]);
  const eligibleStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return availableStudents.filter((student) => {
      if (enrolledIds.has(asKey(student.id))) return false;
      if (!normalizedSearch) return true;
      return [studentName(student), student.email, studentIdLabel(student)]
        .some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch));
    });
  }, [availableStudents, enrolledIds, search]);

  const selectedStudents = useMemo(() => {
    const selected = new Set(selectedIds.map(asKey));
    return eligibleStudents.filter((student) => selected.has(asKey(student.id)));
  }, [eligibleStudents, selectedIds]);

  const toggleStudent = (studentId) => {
    const key = asKey(studentId);
    setSelectedIds((current) => current.some((id) => asKey(id) === key)
      ? current.filter((id) => asKey(id) !== key)
      : [...current, studentId]);
    setEnrollError('');
    setSuccessMessage('');
  };

  const handleEnroll = async () => {
    if (submitting) return;
    const ids = [...new Set(selectedStudents.map((student) => student.id))];
    if (classId == null) {
      setEnrollError('Select a class before enrolling students.');
      return;
    }
    if (!ids.length) {
      setEnrollError('Select at least one eligible student to enroll.');
      return;
    }

    setSubmitting(true);
    setEnrollError('');
    setSuccessMessage('');
    try {
      await enrollStudents(classId, ids);
      const newlyEnrolled = selectedStudents.map((student) => ({
        ...student,
        name: studentName(student),
        idNumber: studentIdLabel(student),
        status: student.status || 'active',
      }));
      const updatedLocalEnrollments = mergeById(localEnrollments.current.get(asKey(classId)) ?? [], newlyEnrolled);
      localEnrollments.current.set(asKey(classId), updatedLocalEnrollments);
      setRoster((current) => mergeById(current, newlyEnrolled));
      setSelectedIds([]);
      setSuccessMessage(`${newlyEnrolled.length} student${newlyEnrolled.length === 1 ? '' : 's'} enrolled.`);

      try {
        const refreshed = await getRoster(classId);
        if (Array.isArray(refreshed?.students)) {
          setRoster(mergeById(refreshed.students, localEnrollments.current.get(asKey(classId)) ?? []));
        }
      } catch {
        setRosterError('Enrollment succeeded, but the roster could not refresh. Use Retry to reload it.');
      }
    } catch (error) {
      setEnrollError(friendlyError(error, 'We could not enroll these students. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" component="div" fontWeight={800}>Class Roster</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
              {selectedClass ? `${selectedClass.name} · ${selectedClass.sectionCode || 'No section'}` : 'No class selected'}
            </Typography>
          </Box>
          <Chip
            icon={<PeopleAltOutlined />}
            label={`${roster.length} enrolled`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, fontWeight: 700 }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
        {classId == null ? (
          <Alert severity="info">Choose a class to view its roster and enroll students.</Alert>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>Enrolled Students</Typography>
                    <Typography variant="caption" color="text.secondary">Current roster for this class</Typography>
                  </Box>
                  <Button startIcon={<RefreshOutlined />} size="small" variant="outlined" onClick={loadRoster} disabled={rosterLoading} sx={{ minWidth: 0 }}>Refresh</Button>
                </Stack>
                {rosterError && <Alert severity="error" sx={{ m: 1.5 }} action={<Button color="inherit" size="small" onClick={loadRoster}>Retry</Button>}>{rosterError}</Alert>}
                <Box sx={{ maxHeight: 390, overflowY: 'auto' }}>
                  {rosterLoading ? (
                    <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}><CircularProgress size={28} /></Box>
                  ) : roster.length ? (
                    <List disablePadding>
                      {roster.map((student, index) => (
                        <Box key={student.id}>
                          <ListItem sx={{ px: 2, py: 1.5 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 38, height: 38, bgcolor: 'primary.light', color: 'primary.dark', fontSize: '0.8rem', fontWeight: 800 }}>
                                {studentName(student).split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={<Typography variant="body2" fontWeight={700}>{studentName(student)}</Typography>}
                              secondary={(
                                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                                  {studentIdLabel(student) && <Typography component="span" variant="caption" color="text.secondary">ID: {studentIdLabel(student)}</Typography>}
                                  {student.email && <Typography component="span" variant="caption" color="text.secondary">{student.email}</Typography>}
                                </Stack>
                              )}
                            />
                            <Chip label={displayLabel(student.status || 'Enrolled')} size="small" color={/^(active|enrolled|completed)$/i.test(student.status || 'Enrolled') ? 'success' : 'default'} />
                          </ListItem>
                          {index < roster.length - 1 && <Divider component="li" />}
                        </Box>
                      ))}
                    </List>
                  ) : !rosterError ? (
                    <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center', px: 2 }}>
                      <Stack spacing={1} sx={{ alignItems: 'center' }}>
                        <PeopleAltOutlined sx={{ fontSize: 42, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>No students enrolled yet.</Typography>
                      </Stack>
                    </Box>
                  ) : null}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight={800}>Enroll Students</Typography>
                  <Typography variant="caption" color="text.secondary">Select eligible students to add to this class</Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  {studentsError && <Alert severity="error" sx={{ mb: 1.5 }} action={<Button color="inherit" size="small" onClick={loadStudents}>Retry</Button>}>{studentsError}</Alert>}
                  {enrollError && <Alert severity="error" sx={{ mb: 1.5 }}>{enrollError}</Alert>}
                  {successMessage && <Alert severity="success" sx={{ mb: 1.5 }}>{successMessage}</Alert>}
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search by name, email, or student ID…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined color="action" /></InputAdornment> } }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Available students</Typography>
                    <Chip size="small" label={`${selectedStudents.length} selected`} color={selectedStudents.length ? 'primary' : 'default'} variant="outlined" />
                  </Box>
                </Box>
                <Divider />
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {studentsLoading ? (
                    <Box sx={{ minHeight: 180, display: 'grid', placeItems: 'center' }}><CircularProgress size={28} /></Box>
                  ) : studentsError ? null : eligibleStudents.length ? (
                    <List disablePadding>
                      {eligibleStudents.map((student, index) => {
                        const checked = selectedIds.some((id) => asKey(id) === asKey(student.id));
                        return (
                          <Box key={student.id}>
                            <ListItemButton onClick={() => toggleStudent(student.id)} disabled={submitting} sx={{ px: 1.5, py: 1 }}>
                              <Checkbox checked={checked} tabIndex={-1} disableRipple slotProps={{ input: { 'aria-label': `Select ${studentName(student)}` } }} />
                              <ListItemAvatar>
                                <Avatar sx={{ width: 34, height: 34, bgcolor: 'action.selected', color: 'primary.main', fontSize: '0.75rem', fontWeight: 800 }}>
                                  {studentName(student).split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={<Typography variant="body2" fontWeight={700}>{studentName(student)}</Typography>}
                                secondary={(
                                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                                    {studentIdLabel(student) && <Typography component="span" variant="caption" color="text.secondary">ID: {studentIdLabel(student)}</Typography>}
                                    {student.email && <Typography component="span" variant="caption" color="text.secondary">{student.email}</Typography>}
                                  </Stack>
                                )}
                              />
                            </ListItemButton>
                            {index < eligibleStudents.length - 1 && <Divider component="li" />}
                          </Box>
                        );
                      })}
                    </List>
                  ) : (
                    <Box sx={{ minHeight: 180, display: 'grid', placeItems: 'center', px: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {availableStudents.length ? 'No eligible students match this search or all active students are already enrolled.' : 'No eligible students are available.'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={submitting} color="inherit">Close</Button>
        <Button
          onClick={handleEnroll}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AddCircleOutline />}
          disabled={submitting || !selectedStudents.length || classId == null}
          sx={{ minWidth: 168, borderRadius: 2, fontWeight: 700 }}
        >
          {submitting ? 'Enrolling…' : `Enroll ${selectedStudents.length || ''} Student${selectedStudents.length === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

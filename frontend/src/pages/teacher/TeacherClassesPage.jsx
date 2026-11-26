import { displayLabel } from '../../theme';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ClassOutlined from '@mui/icons-material/ClassOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import EnrollmentRoster from '../../components/teacher/EnrollmentRoster';
import { createClass, getClasses, updateClass, updateWeights } from '../../api/classes';
import { getCurrentUser } from '../../api/client';

const CATEGORY_DEFAULTS = { Quiz: 30, Project: 30, 'Module Exam': 40 };

const emptyForm = () => ({
  name: '',
  sectionCode: '',
  description: '',
  schedule: 'TBA',
  weights: { ...CATEGORY_DEFAULTS },
  passingGrade: 75,
});

function isUnauthorized(error) {
  return /\b401\b|unauthori[sz]ed/i.test(error?.message ?? '');
}

// The server's message when there is one (e.g. "The weights must total 100%"), otherwise a fallback.
function errorMessage(error, fallback) {
  if (isUnauthorized(error)) return 'Your session may have expired. Sign in again and retry.';
  const text = error instanceof Error ? error.message : '';
  return text && !/^Request failed/.test(text) ? text : fallback;
}

const sameWeights = (a = {}, b = {}) =>
  Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => Number(b[k]) === Number(v));

function statusLabel(status) {
  return displayLabel(status) || 'Unknown';
}

export default function TeacherClassesPage() {
  const teacher = getCurrentUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState('');

  const loadClasses = useCallback(async () => {
    if (teacher?.id == null) {
      setLoadError('Your teacher account is missing an ID. Sign in again to load your classes.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      const result = await getClasses(teacher.id);
      setClasses(Array.isArray(result) ? result : []);
    } catch (error) {
      setLoadError(isUnauthorized(error)
        ? 'Your session may have expired. Sign in again to view your classes.'
        : 'We could not load your classes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [teacher?.id]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classes.filter((item) => {
      const matchesQuery = !query || [item.name, item.sectionCode, item.description]
        .some((value) => String(value ?? '').toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || String(item.status ?? '').toLowerCase() === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [classes, search, statusFilter]);

  const activeCount = classes.filter((item) => item.status === 'active').length;
  const completedCount = classes.filter((item) => item.status === 'completed').length;
  const totalWeight = Object.values(form.weights).reduce((sum, value) => sum + (Number(value) || 0), 0);

  const openCreateDialog = () => {
    setEditingClass(null);
    setForm(emptyForm());
    setFormError('');
    setCreateOpen(true);
  };

  // 7.1 Update Class: the same dialog, filled with the class's current details.
  const openEditDialog = (classInfo) => {
    setEditingClass(classInfo);
    setForm({
      name: classInfo.name ?? '',
      sectionCode: classInfo.sectionCode ?? '',
      description: classInfo.description ?? '',
      schedule: classInfo.schedule || 'TBA',
      weights: { ...(classInfo.weights && Object.keys(classInfo.weights).length ? classInfo.weights : CATEGORY_DEFAULTS) },
      passingGrade: classInfo.passingGrade ?? 75,
    });
    setFormError('');
    setCreateOpen(true);
  };

  const openRoster = (classInfo) => {
    setSelectedClass(classInfo);
    setRosterOpen(true);
  };

  const closeCreateDialog = () => {
    if (isSubmitting) return;
    setCreateOpen(false);
    setFormError('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const name = form.name.trim();
    const sectionCode = form.sectionCode.trim();
    if (!name || !sectionCode) {
      setFormError('Enter a class name and section code to continue.');
      return;
    }
    if (teacher?.id == null) {
      setFormError('Your teacher session is missing. Sign in again before saving a class.');
      return;
    }
    if (totalWeight !== 100) {
      setFormError(`Assessment weights must total 100%. Current total: ${totalWeight}%.`);
      return;
    }
    if (form.passingGrade === '') {
      setFormError('Enter a passing grade between 1 and 100.');
      return;
    }
    const passingGrade = Number(form.passingGrade);
    if (!Number.isFinite(passingGrade) || passingGrade < 1 || passingGrade > 100) {
      setFormError('Passing grade must be between 1 and 100.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    const payload = {
      name,
      sectionCode,
      teacherId: teacher.id,
      description: form.description.trim(),
      schedule: form.schedule.trim() || 'TBA',
      categories: Object.keys(form.weights),
      weights: Object.fromEntries(Object.entries(form.weights).map(([category, weight]) => [category, Number(weight)])),
      passingGrade,
    };

    try {
      if (editingClass) {
        let updated = await updateClass(editingClass.id, {
          name, sectionCode, description: payload.description, schedule: payload.schedule, passingGrade,
        });
        if (!sameWeights(payload.weights, editingClass.weights)) {
          const saved = await updateWeights(editingClass.id, payload.weights);
          updated = { ...updated, weights: saved?.weights ?? payload.weights };
        }
        setClasses((current) => current.map((item) => (item.id === editingClass.id ? { ...item, ...updated } : item)));
        setCreateOpen(false);
        setEditingClass(null);
        setNotice('Class updated successfully.');
      } else {
        const created = await createClass(payload);
        if (!created || typeof created !== 'object') throw new Error('The class response was incomplete.');
        setClasses((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        setCreateOpen(false);
        setForm(emptyForm());
        setNotice('Class created successfully.');
      }
    } catch (error) {
      setFormError(errorMessage(error, editingClass
        ? 'We could not update the class. Check the details and try again.'
        : 'We could not create the class. Check the details and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="pageTitle">My Classes</Typography>
          <Typography variant="pageDescription" color="text.secondary">Manage your assigned classroom sections.</Typography>
        </Box>
        <Button startIcon={<AddOutlined />} onClick={openCreateDialog} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' }, borderRadius: 2, fontWeight: 700, px: 2.5 }}>
          New Class
        </Button>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={loadClasses}>Retry</Button>}>
          {loadError}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, border: 1, borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { lg: 'center' } }}>
          <TextField
            size="small"
            placeholder="Search by name or section…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ flex: 1, minWidth: { lg: 260 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined color="action" /></InputAdornment> } }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="class-status-filter-label">Status</InputLabel>
            <Select
              labelId="class-status-filter-label"
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ borderRadius: 2, bgcolor: 'background.default' }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Chip label={`${activeCount} Active`} size="small" color="success" variant="outlined" />
            <Chip color="success" label={`${completedCount} Completed`} size="small" variant="outlined" />
            <Chip label={`${filteredClasses.length} Shown`} size="small" color="primary" variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 760 }} aria-label="Teacher classes">
          <TableHead>
            <TableRow>
<<<<<<< Updated upstream
              <TableCell sx={{ fontWeight: 800 }}>Class</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Section</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Schedule</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>Enrolled</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
=======
              <TableCell>Class Name</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Enrolled</TableCell>
              <TableCell align="right">Roster</TableCell>
>>>>>>> Stashed changes
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} aria-label="Loading classes" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading your classes…</Typography>
                </TableCell>
              </TableRow>
            ) : filteredClasses.length ? filteredClasses.map((item) => {
              const isCompleted = String(item.status).toLowerCase() === 'completed';
              return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Box sx={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: isCompleted ? 'action.hover' : 'primary.light', color: isCompleted ? 'text.secondary' : 'primary.dark' }}>
                        <ClassOutlined fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700}>{item.name}</Typography>
                        {item.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.description}</Typography>}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell><Chip label={item.sectionCode || '—'} size="small" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{item.schedule || 'TBA'}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabel(item.status)}
                      size="small"
                      color={isCompleted || item.status === 'active' ? 'success' : 'default'}
                      variant={isCompleted ? 'outlined' : 'filled'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                      <PeopleAltOutlined fontSize="small" color="action" />
                      <Typography fontWeight={800}>{item.studentCount ?? 0}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
<<<<<<< Updated upstream
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<EditOutlined fontSize="small" />}
                        onClick={() => openEditDialog(item)}
                        disabled={isCompleted}
                        title={isCompleted ? 'This class has ended. Its details are final.' : 'Edit class details'}
                        aria-label={`Edit ${item.name}`}
                        sx={{ borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}
                      >
                        Edit
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => openRoster(item)} sx={{ borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        View Roster
                      </Button>
                    </Stack>
=======
                    <Button startIcon={<VisibilityOutlined />} size="small" variant="outlined" onClick={() => openRoster(item)} sx={{ borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      View Roster
                    </Button>
>>>>>>> Stashed changes
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <ClassOutlined color="disabled" sx={{ fontSize: 32 }} />
                  <Typography fontWeight={700} sx={{ mt: 1 }}>
                    {loadError ? 'Classes could not be loaded.' : classes.length ? 'No classes match your filters.' : 'No classes assigned yet.'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {loadError ? 'Retry loading your classes before changing or creating class records.' : classes.length ? 'Try changing your search or status filter.' : 'Create a class to get your teaching space started.'}
                  </Typography>
                  {!loadError && !classes.length && (
                    <Button onClick={openCreateDialog} startIcon={<AddOutlined />} sx={{ mt: 2, borderRadius: 2 }}>
                      Create your first class
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createOpen} onClose={closeCreateDialog} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleCreate} noValidate>
          <DialogTitle sx={{ pb: 1 }}>
<<<<<<< Updated upstream
            <Typography variant="h6" component="div" fontWeight={800}>{editingClass ? 'Edit Class' : 'Create New Class'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
              {editingClass ? `Update the details of ${editingClass.sectionCode}.` : 'Add a class to your teaching schedule.'}
            </Typography>
=======
            <Typography variant="h6" component="div">Create New Class</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>Add a class to your teaching schedule.</Typography>
>>>>>>> Stashed changes
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField
                label="Class Name"
                required
                autoFocus
                value={form.name}
                onChange={(event) => { setForm((current) => ({ ...current, name: event.target.value })); setFormError(''); }}
                disabled={isSubmitting}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Section Code"
                    required
                    value={form.sectionCode}
                    onChange={(event) => { setForm((current) => ({ ...current, sectionCode: event.target.value })); setFormError(''); }}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Schedule"
                    value={form.schedule}
                    onChange={(event) => setForm((current) => ({ ...current, schedule: event.target.value }))}
                    placeholder="e.g. MWF 9:00–10:30"
                    disabled={isSubmitting}
                  />
                </Grid>
              </Grid>
              <TextField
                label="Description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                multiline
                minRows={2}
                disabled={isSubmitting}
              />

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Assessment Weights</Typography>
                <Grid container spacing={1.5}>
                  {Object.entries(form.weights).map(([category, weight]) => (
                    <Grid key={category} size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label={`${category} (%)`}
                        type="number"
                        value={weight}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          weights: { ...current.weights, [category]: event.target.value === '' ? '' : Number(event.target.value) },
                        }))}
                        disabled={isSubmitting}
                        slotProps={{ htmlInput: { min: 1, max: 100 } }} />
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="caption" color={totalWeight === 100 ? 'text.secondary' : 'error'} sx={{ display: 'block', mt: 0.75 }}>
                  Total: {totalWeight}% (must equal 100%)
                </Typography>
              </Box>

              <TextField
                label="Passing Grade (%)"
                type="number"
                value={form.passingGrade}
                onChange={(event) => setForm((current) => ({ ...current, passingGrade: event.target.value === '' ? '' : Number(event.target.value) }))}
                disabled={isSubmitting}
                slotProps={{ htmlInput: { min: 1, max: 100 } }} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button variant="text" onClick={closeCreateDialog} disabled={isSubmitting} color="inherit">Cancel</Button>
            <Button
              type="submit"
              startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : editingClass ? <EditOutlined /> : <AddOutlined />}
              disabled={isSubmitting}
              sx={{ borderRadius: 2, fontWeight: 700, minWidth: 140 }}
            >
              {isSubmitting ? 'Saving…' : editingClass ? 'Save Changes' : 'Create Class'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <EnrollmentRoster
        open={rosterOpen}
        selectedClass={selectedClass}
        onClose={() => setRosterOpen(false)}
      />

      <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setNotice('')} sx={{ fontWeight: 600 }}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
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
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import ClassOutlined from '@mui/icons-material/ClassOutlined';
import RadioButtonCheckedOutlined from '@mui/icons-material/RadioButtonCheckedOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { getClasses } from '../../api/classes';

function getTeacherName(item) {
  if (typeof item.teacher === 'string') return item.teacher;
  return item.teacher?.name || item.teacherName || '';
}

function getStatus(item) {
  return String(item.status ?? '').trim().toLowerCase();
}

function statusText(status) {
  if (!status) return 'Unknown';
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function isUnauthorized(error) {
  return /\b401\b|unauthori[sz]ed|forbidden|\b403\b/i.test(error?.message ?? '');
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      // No teacher ID means the API returns the system-wide class list.
      const result = await getClasses();
      setClasses(Array.isArray(result) ? result : []);
    } catch (error) {
      setLoadError(isUnauthorized(error)
        ? 'Your session may have expired or your account cannot view these classes. Sign in with an administrator account and try again.'
        : 'We could not load classes right now. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const statuses = useMemo(() => [...new Set(classes.map(getStatus).filter(Boolean))], [classes]);
  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classes.filter((item) => {
      const searchable = [item.name, item.sectionCode, item.description, getTeacherName(item)];
      const matchesSearch = !query || searchable.some((value) => String(value ?? '').toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || getStatus(item) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [classes, search, statusFilter]);

  const activeCount = classes.filter((item) => getStatus(item) === 'active').length;
  const completedCount = classes.filter((item) => getStatus(item) === 'completed').length;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3.5 }} spacing={1}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>All Classes</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Institutional overview of all academic sections.</Typography>
        </Box>
        {!loading && !loadError && <Chip label={`${filteredClasses.length} ${filteredClasses.length === 1 ? 'Class' : 'Classes'} Found`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 800 }} />}
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2.5 }} action={<Button color="inherit" size="small" onClick={loadClasses}>Retry</Button>}>
          {loadError}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2.5, border: 1, borderColor: 'divider', borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
          <TextField
            placeholder="Search by class, section, or teacher..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ flex: 1, minWidth: { md: 280 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined color="action" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search classes' } }} />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              displayEmpty
              aria-label="Filter classes by status"
              sx={{ borderRadius: 2, bgcolor: 'background.default', fontWeight: 600 }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              {statuses.map((status) => <MenuItem key={status} value={status}>{statusText(status)}</MenuItem>)}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Chip label={`${activeCount} Active`} size="small" color="success" variant="outlined" />
            <Chip label={`${completedCount} Completed`} size="small" variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 760 }} aria-label="All classes">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Class / Course</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Teacher</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Section</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Schedule</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>Students</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                  <CircularProgress size={28} aria-label="Loading classes" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading all classes...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredClasses.length ? filteredClasses.map((item) => {
              const teacherName = getTeacherName(item);
              const status = getStatus(item);
              const isCompleted = status === 'completed';
              return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                      <Box sx={{ width: 36, height: 36, display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.dark' }}>
                        <ClassOutlined fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700}>{item.name || 'Unnamed class'}</Typography>
                        {item.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.description}</Typography>}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {teacherName ? (
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'secondary.main' }}>{teacherName.charAt(0).toUpperCase()}</Avatar>
                        <Typography variant="body2" fontWeight={600}>{teacherName}</Typography>
                      </Stack>
                    ) : <Typography variant="body2" color="text.secondary">Not assigned</Typography>}
                  </TableCell>
                  <TableCell>{item.sectionCode ? <Chip label={item.sectionCode} size="small" variant="outlined" sx={{ fontWeight: 700 }} /> : <Typography color="text.secondary">—</Typography>}</TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{item.schedule || '—'}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      icon={isCompleted ? <CheckCircleOutline /> : status === 'active' ? <RadioButtonCheckedOutlined /> : undefined}
                      label={statusText(status)}
                      size="small"
                      color={isCompleted ? 'default' : status === 'active' ? 'success' : 'primary'}
                      variant={status === 'active' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {item.studentCount != null ? <Typography fontWeight={800}>{item.studentCount}</Typography> : <Typography color="text.secondary">—</Typography>}
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                  <ClassOutlined color="disabled" sx={{ fontSize: 42 }} />
                  <Typography fontWeight={700} sx={{ mt: 1 }}>
                    {loadError ? 'Classes are unavailable.' : classes.length ? 'No classes match your search.' : 'No classes available yet.'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {loadError ? 'Retry loading the class list.' : classes.length ? 'Try another class, section, teacher, or status.' : 'Classes will appear here when they are added to EduTrack.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

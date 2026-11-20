import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
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
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { getCurrentUser } from '../../api/client';
import { getStudentAssessments } from '../../api/students';

function isUnauthorized(error) {
  return /\b401\b|\b403\b|unauthori[sz]ed|forbidden/i.test(error?.message ?? '');
}

function assessmentStatus(item) {
  if (item.status == null || String(item.status).trim() === '') return 'Status unavailable';
  return String(item.status).trim();
}

function statusColor(status) {
  const normalized = status.toLowerCase();
  if (normalized === 'graded') return 'success';
  if (normalized === 'pending') return 'warning';
  return 'default';
}

function SummaryTile({ label, count, icon, color }) {
  return (
    <Paper elevation={0} sx={{ p: 2.25, border: 1, borderColor: 'divider', borderRadius: 3, height: '100%' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box sx={{ p: 1.2, display: 'flex', borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main` }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
          <Typography variant="h5" fontWeight={800}>{count}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function AssessmentsPage() {
  const studentId = getCurrentUser()?.id;
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadAssessments = useCallback(async () => {
    if (studentId == null) {
      setAssessments([]);
      setLoadError('Your student account is missing an ID. Sign in again to view your assessments.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      const result = await getStudentAssessments(studentId);
      setAssessments(Array.isArray(result) ? result : []);
    } catch (error) {
      setAssessments([]);
      setLoadError(isUnauthorized(error)
        ? 'Your session may have expired or your account cannot view these assessments. Sign in again and retry.'
        : 'We could not load your assessments. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadAssessments(); }, [loadAssessments]);

  const classes = useMemo(() => [...new Set(assessments.map((item) => item.className).filter(Boolean))], [assessments]);
  const categories = useMemo(() => [...new Set(assessments.map((item) => item.type).filter(Boolean))], [assessments]);
  const statuses = useMemo(() => [...new Set(assessments.map(assessmentStatus))], [assessments]);

  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assessments.filter((item) => {
      const matchesSearch = !query || [item.title, item.className, item.type]
        .some((value) => String(value ?? '').toLowerCase().includes(query));
      const matchesClass = classFilter === 'all' || item.className === classFilter;
      const matchesCategory = categoryFilter === 'all' || item.type === categoryFilter;
      const matchesStatus = statusFilter === 'all' || assessmentStatus(item) === statusFilter;
      return matchesSearch && matchesClass && matchesCategory && matchesStatus;
    });
  }, [assessments, search, classFilter, categoryFilter, statusFilter]);

  const gradedCount = assessments.filter((item) => assessmentStatus(item).toLowerCase() === 'graded').length;
  const pendingCount = assessments.filter((item) => assessmentStatus(item).toLowerCase() === 'pending').length;

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.7px' }}>My Assessments</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          View your assessments, scores, and grading status across your enrolled classes.
        </Typography>
      </Box>

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadAssessments} disabled={loading}>Retry</Button>}>
          {loadError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress aria-label="Loading assessments" />
            <Typography variant="body2" color="text.secondary">Loading your assessments...</Typography>
          </Stack>
        </Box>
      ) : !loadError && (
        <>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}><SummaryTile label="Total Assessments" count={assessments.length} icon={<AssignmentOutlined />} color="primary" /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><SummaryTile label="Graded" count={gradedCount} icon={<CheckCircleOutline />} color="success" /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><SummaryTile label="Pending" count={pendingCount} icon={<AssignmentOutlined />} color="warning" /></Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2.5, border: 1, borderColor: 'divider', borderRadius: 3 }}>
            <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  placeholder="Search assessments or classes..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined color="action" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search assessments' } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assessment-class-filter-label">Class</InputLabel>
                  <Select labelId="assessment-class-filter-label" label="Class" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                    <MenuItem value="all">All classes</MenuItem>
                    {classes.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assessment-category-filter-label">Category</InputLabel>
                  <Select labelId="assessment-category-filter-label" label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    <MenuItem value="all">All categories</MenuItem>
                    {categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assessment-status-filter-label">Status</InputLabel>
                  <Select labelId="assessment-status-filter-label" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <MenuItem value="all">All statuses</MenuItem>
                    {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 820 }} aria-label="Student assessments">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Assessment Title</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Score</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Perfect Score</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssessments.length ? filteredAssessments.map((item, index) => {
                  const status = assessmentStatus(item);
                  const normalizedStatus = status.toLowerCase();
                  const isGraded = normalizedStatus === 'graded';
                  const isPending = normalizedStatus === 'pending';
                  const hasScore = item.score !== null && item.score !== undefined;
                  return (
                    <TableRow key={item.id ?? `${item.title}-${index}`} hover>
                      <TableCell><Typography fontWeight={700}>{item.title || 'Untitled assessment'}</Typography></TableCell>
                      <TableCell>{item.className || <Typography variant="body2" color="text.secondary">Class unavailable</Typography>}</TableCell>
                      <TableCell>{item.type ? <Chip label={item.type} size="small" variant="outlined" sx={{ fontWeight: 700 }} /> : <Typography variant="body2" color="text.secondary">—</Typography>}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={hasScore ? 800 : 400} color={hasScore ? 'text.primary' : 'text.secondary'}>
                          {hasScore ? item.score : isPending ? 'Not Yet Graded' : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color={item.perfectScore == null ? 'text.secondary' : 'text.primary'}>
                          {item.perfectScore ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={status}
                          size="small"
                          color={statusColor(status)}
                          variant={isGraded ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                      <AssignmentOutlined color="disabled" sx={{ fontSize: 42 }} />
                      <Typography fontWeight={700} sx={{ mt: 1 }}>
                        {assessments.length ? 'No assessments match your search or filters.' : 'No assessments available yet.'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {assessments.length ? 'Try changing your search or filter selections.' : 'Assessments for your classes will appear here when they are available.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25, textAlign: 'right' }}>
            Showing {filteredAssessments.length} of {assessments.length} assessments
          </Typography>
        </>
      )}
    </Box>
  );
}

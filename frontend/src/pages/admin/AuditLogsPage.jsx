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
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { getAuditLogs } from '../../api/auditLogs';

function isUnauthorized(error) {
  return /\b401\b|\b403\b|unauthori[sz]ed|forbidden/i.test(error?.message ?? '');
}

function readableAction(action) {
  if (action == null || String(action).trim() === '') return 'Unknown action';
  return String(action)
    .trim()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

function safeDateValue(timestamp) {
  if (timestamp == null || String(timestamp).trim() === '') return null;
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTimestamp(timestamp) {
  if (timestamp == null || String(timestamp).trim() === '') return 'Timestamp unavailable';
  const parsed = safeDateValue(timestamp);
  if (parsed === null) return 'Invalid timestamp';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(parsed));
}

function newestFirst(records) {
  return records
    .map((record, index) => ({ record, index, time: safeDateValue(record.timestamp) }))
    .sort((left, right) => {
      if (left.time === null && right.time !== null) return 1;
      if (left.time !== null && right.time === null) return -1;
      if (left.time !== null && right.time !== null && left.time !== right.time) return right.time - left.time;
      return left.index - right.index;
    })
    .map(({ record }) => record);
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setLogs([]);
    setPage(0);
    try {
      const result = await getAuditLogs();
      if (!Array.isArray(result)) throw new Error('Invalid audit log response.');
      setLogs(result.filter((record) => record && typeof record === 'object'));
    } catch (error) {
      setLoadError(isUnauthorized(error)
        ? 'Your session may have expired or your account cannot view audit logs. Sign in with an administrator account and retry.'
        : 'We could not load audit logs. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const sortedLogs = useMemo(() => newestFirst(logs), [logs]);
  const actions = useMemo(() => [...new Set(logs.map((record) => record.action).filter((value) => value != null && String(value).trim()))], [logs]);
  const roles = useMemo(() => [...new Set(logs.map((record) => record.actorRole).filter((value) => value != null && String(value).trim()))], [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortedLogs.filter((record) => {
      const action = String(record.action ?? '');
      const matchesSearch = !query || [action, readableAction(action), record.actorName, record.actorRole, record.details]
        .some((value) => String(value ?? '').toLowerCase().includes(query));
      const matchesAction = actionFilter === 'all' || action === actionFilter;
      const matchesRole = roleFilter === 'all' || String(record.actorRole ?? '') === roleFilter;
      return matchesSearch && matchesAction && matchesRole;
    });
  }, [sortedLogs, search, actionFilter, roleFilter]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredLogs.length / rowsPerPage) - 1);
    if (page > lastPage) setPage(lastPage);
  }, [filteredLogs.length, page, rowsPerPage]);

  const visibleLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const updateSearch = (value) => {
    setSearch(value);
    setPage(0);
  };

  const updateAction = (value) => {
    setActionFilter(value);
    setPage(0);
  };

  const updateRole = (value) => {
    setRoleFilter(value);
    setPage(0);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3.5 }}>
        <Box sx={{ p: 1.2, display: 'flex', borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
          <HistoryOutlined />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.6px' }}>Audit Logs</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.4 }}>Monitor and review recorded activities across the EduTrack system.</Typography>
        </Box>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2.5 }} action={<Button color="inherit" size="small" onClick={loadLogs} disabled={loading}>Retry</Button>}>
          {loadError}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2.5, border: 1, borderColor: 'divider', borderRadius: 3 }}>
        <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              placeholder="Search actions, people, roles, or details..."
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              disabled={loading || Boolean(loadError)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined color="action" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search audit logs' } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small" disabled={loading || Boolean(loadError)}>
              <InputLabel id="audit-action-filter-label">Action</InputLabel>
              <Select labelId="audit-action-filter-label" label="Action" value={actionFilter} onChange={(event) => updateAction(event.target.value)}>
                <MenuItem value="all">All actions</MenuItem>
                {actions.map((action) => <MenuItem key={action} value={action}>{readableAction(action)}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small" disabled={loading || Boolean(loadError)}>
              <InputLabel id="audit-role-filter-label">User Role</InputLabel>
              <Select labelId="audit-role-filter-label" label="User Role" value={roleFilter} onChange={(event) => updateRole(event.target.value)}>
                <MenuItem value="all">All roles</MenuItem>
                {roles.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 900 }} aria-label="System audit logs">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Performed By</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>User Role</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 7 }}>
                  <CircularProgress size={28} aria-label="Loading audit logs" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading audit records...</Typography>
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">Audit records are unavailable.</Typography></TableCell></TableRow>
            ) : visibleLogs.length ? visibleLogs.map((record, index) => (
              <TableRow key={record.id ?? `${record.timestamp ?? 'audit'}-${page}-${index}`} hover>
                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatTimestamp(record.timestamp)}</TableCell>
                <TableCell><Chip label={readableAction(record.action)} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                <TableCell><Typography variant="body2" fontWeight={700}>{record.actorName || '—'}</Typography></TableCell>
                <TableCell>{record.actorRole ? <Chip label={record.actorRole} size="small" variant="outlined" /> : <Typography variant="body2" color="text.secondary">—</Typography>}</TableCell>
                <TableCell sx={{ maxWidth: 420, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                  <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{record.details || '—'}</Typography>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 7 }}>
                  <HistoryOutlined color="disabled" sx={{ fontSize: 42 }} />
                  <Typography fontWeight={700} sx={{ mt: 1 }}>
                    {logs.length ? 'No audit records match your search or filters.' : 'No audit logs available yet.'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {logs.length ? 'Try adjusting the search or filter selections.' : 'Recorded system activities will appear here.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredLogs.length}
          page={page}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Rows per page:"
        />
      </TableContainer>
    </Box>
  );
}

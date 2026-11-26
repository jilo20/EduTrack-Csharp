// OWNER: Lopez, Mary Vincent | WBS 5.2 Invite Center
import AddOutlined from '@mui/icons-material/AddOutlined';
import { useEffect, useState } from 'react';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { getInvites, createInvite } from '../../api/invites';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

export default function InviteCenterPage() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [roleId, setRoleId] = useState(3);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [created, setCreated] = useState(null);

  async function load() {
    setLoading(true); setError('');
    try { setInvites(await getInvites()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function generate() {
    setSaving(true); setSaveError('');
    try {
      const invite = await createInvite(roleId);
      setInvites((rows) => [invite, ...rows]);
      setCreated(invite); setOpen(false);
    } catch (e) { setSaveError(e.message); }
    finally { setSaving(false); }
  }

  const visible = invites.filter((i) =>
    i.idNumber.toLowerCase().includes(search.trim().toLowerCase()) &&
    (roleFilter === 'all' || i.role === roleFilter) &&
    (status === 'all' || i.isUsed === (status === 'used')));

  return <Stack spacing={2}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <Typography variant="pageTitle">Invite Center</Typography>
        <Typography variant="pageDescription" color="text.secondary">Generate and track registration invites.</Typography>
      </div>
      <Button startIcon={<AddOutlined />} variant="contained" onClick={() => { setSaveError(''); setOpen(true); }}>Generate Invite</Button>
    </Stack>
    {created && <Alert severity="success" onClose={() => setCreated(null)}>New {created.role} invite: {created.idNumber}</Alert>}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField label="Search Invite ID" value={search} onChange={(e) => setSearch(e.target.value)} />
      <TextField select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 150 }}>
        <MenuItem value="all">All Roles</MenuItem><MenuItem value="Student">Student</MenuItem><MenuItem value="Teacher">Teacher</MenuItem>
      </TextField>
      <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 150 }}>
        <MenuItem value="all">All Statuses</MenuItem><MenuItem value="available">Available</MenuItem><MenuItem value="used">Used</MenuItem>
      </TextField>
    </Stack>
    {loading ? <LoadingState message="Loading invites…" /> :
      error ? <ErrorState message={error} onRetry={load} /> :
      visible.length === 0 ? <EmptyState title="No Invites Found" description="No invites match. Change your filters or generate an invite." /> :
      <TableContainer component={Paper}><Table aria-label="Invite IDs">
        <TableHead><TableRow>{['Invite ID', 'Role', 'Status', 'Date Created'].map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>{visible.map((i) => <TableRow key={i.id}>
          <TableCell>{i.idNumber}</TableCell><TableCell>{i.role}</TableCell>
          <TableCell><Chip size="small" label={i.isUsed ? 'Used' : 'Available'} color={i.isUsed ? 'default' : 'success'} /></TableCell>
          <TableCell>{new Date(i.createdAt).toLocaleString()}</TableCell>
        </TableRow>)}</TableBody>
      </Table></TableContainer>}
    <Dialog open={open} onClose={() => { if (!saving) setOpen(false); }} fullWidth maxWidth="xs">
      <DialogTitle>Generate Invite ID</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {saveError && <Alert severity="error">{saveError}</Alert>}
        <TextField select label="Account Role" value={roleId} disabled={saving} onChange={(e) => setRoleId(Number(e.target.value))}>
          <MenuItem value={3}>Student</MenuItem><MenuItem value={2}>Teacher</MenuItem>
        </TextField>
        <Typography color="text.secondary">The system generates a unique ID automatically.</Typography>
      </Stack></DialogContent>
      <DialogActions><Button variant="text" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" disabled={saving} onClick={generate}>{saving ? 'Generating…' : 'Generate'}</Button></DialogActions>
    </Dialog>
  </Stack>;
}

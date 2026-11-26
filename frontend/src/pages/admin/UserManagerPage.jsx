import EditOutlined from '@mui/icons-material/EditOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { displayLabel } from '../../theme';
// OWNER: Lopez, Mary Vincent | WBS 6.4 User Manager
import { useEffect, useState } from 'react';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { getUsers, createUser, updateUser, deactivateUser } from '../../api/users';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const roleIds = { Student: 3, Teacher: 2 };
export default function UserManagerPage() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('Student');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true); setError('');
    try { setUsers(await getUsers()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const visible = users.filter((u) => u.role === role &&
    [u.firstName, u.lastName, u.email, u.idNumber].join(' ').toLowerCase().includes(search.trim().toLowerCase()));

  function edit(user) {
    setSaveError('');
    setForm(user ? { ...user, password: '' } :
      { firstName: '', lastName: '', email: '', password: '', role, status: 'active' });
  }
  async function save(e) {
    e.preventDefault();
    setSaving(true); setSaveError('');
    const data = {
      firstName: form.firstName.trim(), lastName: form.lastName.trim(),
      email: form.email.trim(), roleId: roleIds[form.role],
      ...(form.id ? { status: form.status } : { password: form.password }),
    };
    if (!data.firstName || !data.lastName) {
      setSaveError('First and last name are required.'); setSaving(false); return;
    }
    try {
      const result = form.id ? await updateUser(form.id, data) : await createUser(data);
      // Preserve display fields when mock responses only contain the input fields.
      const user = { ...form, ...result, role: form.role };
      delete user.password;
      delete user.roleId;
      setUsers((rows) => form.id ? rows.map((u) => u.id === form.id ? user : u) : [...rows, user]);
      setNotice(form.id ? 'Account updated.' : 'Account created.');
      setForm(null);
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  }
  async function deactivate() {
    setSaving(true); setSaveError('');
    try {
      await deactivateUser(target.id);
      setUsers((rows) => rows.map((u) => u.id === target.id ? { ...u, status: 'inactive' } : u));
      setTarget(null); setNotice('Account deactivated.');
    } catch (e) { setSaveError(e.message); }
    finally { setSaving(false); }
  }
  const change = (key) => (e) => setForm((previous) => ({ ...previous, [key]: e.target.value }));

  return <Stack spacing={2}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <Typography variant="pageTitle">User Manager</Typography>
        <Typography variant="pageDescription" color="text.secondary">Manage student and teacher accounts.</Typography>
      </div>
      <Button startIcon={<AddOutlined />} variant="contained" onClick={() => edit(null)}>Add {role}</Button>
    </Stack>
    {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
    <Tabs value={role} onChange={(_, value) => setRole(value)} aria-label="Account Role">
      <Tab label="Students" value="Student" /><Tab label="Teachers" value="Teacher" />
    </Tabs>
    <TextField label="Search Name, Email, or ID" value={search} onChange={(e) => setSearch(e.target.value)} />
    {loading ? <LoadingState message="Loading accounts…" /> :
      error ? <ErrorState message={error} onRetry={load} /> :
      visible.length === 0 ? <EmptyState title="No Accounts Found" description="No accounts match your search in this tab." /> :
      <TableContainer component={Paper}><Table aria-label="User accounts">
        <TableHead><TableRow>{['Name', 'Email Address', 'ID Number', 'Status', 'Actions'].map((h) => <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>{visible.map((u) => <TableRow key={u.id}>
          <TableCell>{u.firstName} {u.lastName}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.idNumber || 'Pending'}</TableCell>
          <TableCell><Chip size="small" label={displayLabel(u.status)} color={u.status === 'active' ? 'success' : 'default'} /></TableCell>
          <TableCell align="right"><Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
            <Button startIcon={<EditOutlined />} size="small" variant="text" onClick={() => edit(u)} aria-label={`Edit ${u.firstName} ${u.lastName}`}>Edit</Button>
            <Button size="small" variant="text" color="error" disabled={u.status === 'inactive'} onClick={() => { setSaveError(''); setTarget(u); }} aria-label={`Deactivate ${u.firstName} ${u.lastName}`}>Deactivate</Button>
          </Stack></TableCell>
        </TableRow>)}</TableBody>
      </Table></TableContainer>}
    <Dialog open={Boolean(form)} onClose={() => { if (!saving) setForm(null); }} fullWidth maxWidth="sm">
      {form && <Stack component="form" onSubmit={save}>
        <DialogTitle>{form.id ? 'Edit Account' : 'Add Account'}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <TextField required label="First Name" value={form.firstName} onChange={change('firstName')} disabled={saving} slotProps={{ htmlInput: { maxLength: 50 } }} />
          <TextField required label="Last Name" value={form.lastName} onChange={change('lastName')} disabled={saving} slotProps={{ htmlInput: { maxLength: 50 } }} />
          <TextField required type="email" label="Email Address" value={form.email} onChange={change('email')} disabled={saving} slotProps={{ htmlInput: { maxLength: 50 } }} />
          {!form.id && <TextField required type="password" label="Initial Password" value={form.password} onChange={change('password')} disabled={saving} helperText="Use at least 8 characters." slotProps={{ htmlInput: { minLength: 8, maxLength: 100 } }} />}
          <TextField select label="Role" value={form.role} onChange={change('role')} disabled={saving}>
            <MenuItem value="Student">Student</MenuItem><MenuItem value="Teacher">Teacher</MenuItem>
          </TextField>
          {form.id && <TextField select label="Status" value={form.status} onChange={change('status')} disabled={saving}>
            <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
          </TextField>}
        </Stack></DialogContent>
        <DialogActions><Button variant="text" disabled={saving} onClick={() => setForm(null)}>Cancel</Button><Button variant="contained" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></DialogActions>
      </Stack>}
    </Dialog>
    <Dialog open={Boolean(target)} onClose={() => { if (!saving) setTarget(null); }} fullWidth maxWidth="xs">
      <DialogTitle>Deactivate Account?</DialogTitle>
      <DialogContent><Stack spacing={2}>
        {saveError && <Alert severity="error">{saveError}</Alert>}
        <Typography>Deactivate {target?.firstName} {target?.lastName}? Their records will be preserved.</Typography>
      </Stack></DialogContent>
      <DialogActions><Button variant="text" disabled={saving} onClick={() => setTarget(null)}>Cancel</Button><Button color="error" variant="contained" disabled={saving} onClick={deactivate}>{saving ? 'Deactivating…' : 'Deactivate'}</Button></DialogActions>
    </Dialog>
  </Stack>;
}

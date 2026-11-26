import { displayLabel } from '../../theme';
// OWNER: Lopez, Mary Vincent — WBS 12.3 / 12.4
import { useState } from 'react';
import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material';
import { createAnnouncement } from '../../api/announcements';
import { getCurrentUser } from '../../api/client';

export default function AnnouncementComposer({ classes, onCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [target, setTarget] = useState('all');
  const [sectionId, setSectionId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isClassPost = classes != null;
  async function submit(e) {
    e.preventDefault(); setError('');
    if (title.trim().length < 3 || !content.trim()) { setError('Enter a title of at least 3 characters and a message.'); return; }
    if (isClassPost && !sectionId) { setError('Choose one of your classes.'); return; }
    setBusy(true);
    try {
      const created = await createAnnouncement({
        title: title.trim(), content: content.trim(), priority,
        target: isClassPost ? 'students' : target, sectionId: isClassPost ? Number(sectionId) : null,
      });
      const user = getCurrentUser();
      const author = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name;
      onCreated({
        ...created, author: created.author || author,
        className: isClassPost ? classes.find((c) => c.id === Number(sectionId))?.name : null,
      });
      setTitle(''); setContent(''); setPriority('normal'); setTarget('all'); setSectionId('');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <Stack component="form" onSubmit={submit} spacing={2}>
    {error && <Alert severity="error">{error}</Alert>}
    <TextField required label="Title" value={title} disabled={busy} slotProps={{ htmlInput: { minLength: 3, maxLength: 200 } }} onChange={(e) => setTitle(e.target.value)} />
    <TextField required multiline minRows={5} label="Message" value={content} disabled={busy} helperText={content.length + '/1000 characters'} slotProps={{ htmlInput: { maxLength: 1000 } }} onChange={(e) => setContent(e.target.value)} />
    <TextField select label="Priority" value={priority} disabled={busy} onChange={(e) => setPriority(e.target.value)}>{['normal', 'high', 'urgent'].map((p) => <MenuItem key={p} value={p}>{displayLabel(p)}</MenuItem>)}</TextField>
    {isClassPost ? <TextField select required label="Class" value={sectionId} disabled={busy} onChange={(e) => setSectionId(e.target.value)}>{classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.sectionCode})</MenuItem>)}</TextField> :
      <TextField select label="Audience" value={target} disabled={busy} onChange={(e) => setTarget(e.target.value)}><MenuItem value="all">Everyone</MenuItem><MenuItem value="teachers">Teachers</MenuItem><MenuItem value="students">Students</MenuItem></TextField>}
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
      {onCancel && <Button variant="text" disabled={busy} onClick={onCancel}>Cancel</Button>}
      <Button variant="contained" type="submit" disabled={busy || (isClassPost && !classes.length)}>{busy ? 'Posting…' : isClassPost ? 'Post to Class' : 'Send Broadcast'}</Button>
    </Stack>
  </Stack>;
}

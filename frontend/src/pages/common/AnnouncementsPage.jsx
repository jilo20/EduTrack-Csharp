// OWNER: Lopez, Mary Vincent — WBS 12.4 Announcements
import { useState } from 'react';
import { Alert, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { getAnnouncements } from '../../api/announcements';
import { getCurrentUser } from '../../api/client';
import AnnouncementComposer from '../../components/common/AnnouncementComposer';
import FeatureDataState from '../../components/common/FeatureDataState';
import { useFeatureData, useTeachingClasses } from '../../components/common/featureData';

const priorityColors = { normal: 'default', high: 'warning', urgent: 'error' };
export default function AnnouncementsPage() {
  const resource = useFeatureData(getAnnouncements);
  const [posted, setPosted] = useState([]);
  const [priority, setPriority] = useState('all');
  const [open, setOpen] = useState(false);
  const isTeacher = getCurrentUser()?.role === 'Teacher';
  const announcements = [...posted, ...(resource.data || []).filter((a) => !posted.some((p) => p.id === a.id))]
    .filter((a) => priority === 'all' || a.priority === priority);
  return <Stack spacing={3}>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between' }} spacing={2}>
      <Typography variant="h4">Announcements</Typography>
      {isTeacher && <Button variant="contained" onClick={() => setOpen(true)}>Post to a class</Button>}
    </Stack>
    <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} sx={{ maxWidth: 250 }}><MenuItem value="all">All priorities</MenuItem>{['normal', 'high', 'urgent'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField>
    <FeatureDataState {...resource} onRetry={resource.refresh} empty={!announcements.length && !resource.loading && !resource.error} emptyMessage="No announcements match this filter.">
      {announcements.map((a) => <Card key={a.id} variant="outlined"><CardContent><Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Chip size="small" label={a.priority} color={priorityColors[a.priority] || 'default'} /><Typography variant="h6">{a.title}</Typography></Stack>
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.content}</Typography>
        <Typography variant="body2" color="text.secondary">{a.author || 'EduTrack'} · {a.date?.slice(0, 10)} · {a.className || (a.target === 'all' ? 'Everyone' : a.target)}</Typography>
      </Stack></CardContent></Card>)}
    </FeatureDataState>
    <Dialog open={open} fullWidth maxWidth="sm"><DialogTitle>Post a class announcement</DialogTitle><DialogContent>{open && <TeacherPost onCancel={() => setOpen(false)} onCreated={(a) => { setPosted((rows) => [a, ...rows]); setOpen(false); }} />}</DialogContent></Dialog>
  </Stack>;
}

function TeacherPost({ onCreated, onCancel }) {
  const classes = useTeachingClasses();
  return <Stack spacing={2} sx={{ pt: 1 }}>
    <FeatureDataState {...classes} onRetry={classes.refresh} empty={classes.data?.length === 0} emptyMessage="Create a class before posting an announcement.">
      {classes.data && <AnnouncementComposer classes={classes.data} onCreated={onCreated} onCancel={onCancel} />}
    </FeatureDataState>
    {(classes.loading || classes.error || !classes.data?.length) && <Button onClick={onCancel}>Close</Button>}
    {classes.error && <Alert severity="info">Your announcement has not been posted.</Alert>}
  </Stack>;
}

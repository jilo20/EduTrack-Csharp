import AddOutlined from '@mui/icons-material/AddOutlined';
import { displayLabel } from '../../theme';
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
  return <Stack spacing={2}>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }} spacing={2}>
      <div>
        <Typography variant="pageTitle">Announcements</Typography>
        <Typography variant="pageDescription" color="text.secondary">Read school-wide and class announcements.</Typography>
      </div>
      {isTeacher && <Button startIcon={<AddOutlined />} variant="contained" onClick={() => setOpen(true)}>Post to a Class</Button>}
    </Stack>
    <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} sx={{ maxWidth: 250 }}><MenuItem value="all">All Priorities</MenuItem>{['normal', 'high', 'urgent'].map((p) => <MenuItem key={p} value={p}>{displayLabel(p)}</MenuItem>)}</TextField>
    <FeatureDataState {...resource} onRetry={resource.refresh} empty={!announcements.length && !resource.loading && !resource.error} emptyMessage="No announcements match this filter.">
      {announcements.map((a) => <Card key={a.id} variant="outlined"><CardContent><Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Chip size="small" label={displayLabel(a.priority)} color={priorityColors[a.priority] || 'default'} /><Typography variant="subtitle2" component="h2">{a.title}</Typography></Stack>
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.content}</Typography>
        <Typography variant="body2" color="text.secondary">{a.author || 'EduTrack'} · {a.date?.slice(0, 10)} · {a.className || (a.target === 'all' ? 'Everyone' : displayLabel(a.target))}</Typography>
      </Stack></CardContent></Card>)}
    </FeatureDataState>
    <Dialog open={open} fullWidth maxWidth="sm"><DialogTitle>Post a Class Announcement</DialogTitle><DialogContent>{open && <TeacherPost onCancel={() => setOpen(false)} onCreated={(a) => { setPosted((rows) => [a, ...rows]); setOpen(false); }} />}</DialogContent></Dialog>
  </Stack>;
}

function TeacherPost({ onCreated, onCancel }) {
  const classes = useTeachingClasses();
  return <Stack spacing={2} sx={{ pt: 1 }}>
    <FeatureDataState {...classes} onRetry={classes.refresh} empty={classes.data?.length === 0} emptyMessage="Create a class before posting an announcement.">
      {classes.data && <AnnouncementComposer classes={classes.data} onCreated={onCreated} onCancel={onCancel} />}
    </FeatureDataState>
    {(classes.loading || classes.error || !classes.data?.length) && <Button variant="text" onClick={onCancel}>Close</Button>}
    {classes.error && <Alert severity="info">Your announcement has not been posted.</Alert>}
  </Stack>;
}

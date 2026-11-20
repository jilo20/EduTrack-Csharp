// OWNER: Lopez, Mary Vincent — WBS 12.3 Broadcast Center
import { useState } from 'react';
import { Alert, Paper, Stack, Typography } from '@mui/material';
import AnnouncementComposer from '../../components/common/AnnouncementComposer';

export default function BroadcastCenterPage() {
  const [sent, setSent] = useState(null);
  return <Stack spacing={3} sx={{ maxWidth: 850 }}>
    <Typography variant="h4">Broadcast Center</Typography>
    <Typography color="text.secondary">Send an announcement to everyone, teachers, or students.</Typography>
    {sent && <Alert severity="success" onClose={() => setSent(null)}>“{sent.title}” was sent to {sent.target === 'all' ? 'everyone' : sent.target}.</Alert>}
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><AnnouncementComposer onCreated={setSent} /></Paper>
  </Stack>;
}

// OWNER: Lopez, Mary Vincent — WBS 12.3 Broadcast Center
import { useState } from 'react';
import { Alert, Paper, Stack, Typography } from '@mui/material';
import AnnouncementComposer from '../../components/common/AnnouncementComposer';

export default function BroadcastCenterPage() {
  const [sent, setSent] = useState(null);
  return <Stack spacing={2} sx={{ maxWidth: 850 }}>
    <div>
      <Typography variant="pageTitle">Broadcast Center</Typography>
      <Typography variant="pageDescription" color="text.secondary">Send an announcement to everyone, teachers, or students.</Typography>
    </div>
    {sent && <Alert severity="success" onClose={() => setSent(null)}>“{sent.title}” was sent to {sent.target === 'all' ? 'everyone' : sent.target}.</Alert>}
    <Paper variant="outlined" sx={{ p: 2 }}><AnnouncementComposer onCreated={setSent} /></Paper>
  </Stack>;
}

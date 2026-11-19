// OWNER: Lopez, Mary Vincent — WBS 12.5 Notification Panel
import { useState } from 'react';
import { Alert, Badge, Box, Button, Divider, IconButton, List, ListItem, Paper, Popover, Stack, Tooltip, Typography } from '@mui/material';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import { clearAll, getNotifications, markAllRead, markRead } from '../../api/notifications';
import FeatureDataState from './FeatureDataState';
import { useFeatureData } from './featureData';

export default function NotificationPanel() {
  const resource = useFeatureData(getNotifications);
  const [anchor, setAnchor] = useState(null);
  const [readIds, setReadIds] = useState([]);
  const [clearedIds, setClearedIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const items = (resource.data || []).filter((n) => !clearedIds.includes(n.id))
    .map((n) => ({ ...n, status: readIds.includes(n.id) ? 'read' : n.status }));
  const unread = items.filter((n) => n.status === 'unread').length;
  async function perform(operation, update) {
    setBusy(true); setError('');
    try { await operation(); update(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <>
    <Tooltip title="Notifications"><IconButton aria-label={`Notifications, ${unread} unread`} aria-haspopup="dialog" aria-expanded={Boolean(anchor)} onClick={(e) => setAnchor(e.currentTarget)}>
      <Badge badgeContent={unread} color="error"><NotificationsOutlined /></Badge>
    </IconButton></Tooltip>
    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Paper component="section" role="dialog" aria-label="Notifications" sx={{ width: { xs: 310, sm: 420 }, maxWidth: '95vw', p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Notifications {unread > 0 && '(' + unread + ' unread)'}</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" disabled={busy || resource.loading || !unread} onClick={() => perform(markAllRead, () => setReadIds((ids) => [...new Set([...ids, ...items.map((n) => n.id)])]))}>Read all</Button>
            <Button size="small" color="error" disabled={busy || resource.loading || !items.length} onClick={() => perform(clearAll, () => setClearedIds((ids) => [...new Set([...ids, ...items.map((n) => n.id)])]))}>Clear all</Button>
            <Button size="small" disabled={busy || resource.loading} onClick={resource.refresh}>Refresh</Button>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          <FeatureDataState {...resource} onRetry={resource.refresh} empty={!resource.loading && !resource.error && !items.length} emptyMessage="You're all caught up.">
            <Box sx={{ maxHeight: 380, overflowY: 'auto' }}><List disablePadding>{items.map((n) => <Box key={n.id}>
              <ListItem disableGutters sx={{ bgcolor: n.status === 'unread' ? 'action.hover' : 'transparent', px: 1 }}>
                <Stack spacing={0.5} sx={{ width: '100%' }}>
                  <Typography fontWeight={n.status === 'unread' ? 700 : 500} color={n.type === 'warning' ? 'warning.main' : 'text.primary'}>{n.title}</Typography>
                  <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{n.message}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(n.createdAt).toLocaleString()}</Typography>
                  {n.status === 'unread' && <Button size="small" disabled={busy} sx={{ alignSelf: 'flex-start' }} onClick={() => perform(() => markRead(n.id), () => setReadIds((ids) => [...ids, n.id]))}>Mark as read</Button>}
                </Stack>
              </ListItem><Divider />
            </Box>)}</List></Box>
          </FeatureDataState>
        </Stack>
      </Paper>
    </Popover>
  </>;
}

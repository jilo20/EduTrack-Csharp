// OWNER: Lopez, Mary Vincent. Request states for Mary's feature pages.
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

export default function FeatureDataState({ loading, error, empty, onRetry, emptyMessage = 'No records yet.', children }) {
  if (loading) return <><LoadingState /><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }} role="status"><CircularProgress size={24} /><Typography>Loading…</Typography></Stack></>;
  if (error) return <><ErrorState message={error} onRetry={onRetry} /><Alert severity="error" action={onRetry && <Button color="inherit" onClick={onRetry}>Retry</Button>}>{error}</Alert></>;
  if (empty) return <><EmptyState title={emptyMessage} /><Alert severity="info">{emptyMessage}</Alert></>;
  return children;
}

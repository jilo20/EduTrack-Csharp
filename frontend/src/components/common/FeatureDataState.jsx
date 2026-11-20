// OWNER: Lopez, Mary Vincent. Request states for Mary's feature pages.
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

export default function FeatureDataState({ loading, error, empty, onRetry, emptyMessage = 'No records yet.', children }) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (empty) return <EmptyState title={emptyMessage} />;
  return children;
}

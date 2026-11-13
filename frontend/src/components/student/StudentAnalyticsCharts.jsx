import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getCurrentUser } from '../../api/client';
import { getStudentAnalytics } from '../../api/analytics';

function ChartPanel({ title, subtitle, children }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: 'divider', borderRadius: 3, height: '100%', minHeight: 340 }}>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{subtitle}</Typography>
      <Box sx={{ height: 260, mt: 2 }}>{children}</Box>
    </Paper>
  );
}

export default function StudentAnalyticsCharts() {
  const user = getCurrentUser();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    if (user?.id == null) {
      setError('Your student account is missing an ID, so performance charts cannot be loaded.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setAnalytics(await getStudentAnalytics(user.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load performance charts.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const trend = analytics?.trend ?? [];
  const byCategory = analytics?.byCategory ?? [];

  if (loading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 220 }}><CircularProgress /></Box>;
  }
  if (error) return <Alert severity="info">{error}</Alert>;

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <ChartPanel title="Performance Over Time" subtitle="Assessment scores from your analytics">
          {trend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 16, left: -16, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Score']} contentStyle={{ border: 0, borderRadius: 12, boxShadow: '0 12px 28px rgba(15,23,42,0.12)' }} />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Typography color="text.secondary" sx={{ p: 2 }}>No performance trend is available yet.</Typography>}
        </ChartPanel>
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <ChartPanel title="Category Mastery" subtitle="Average score by assessment category">
          {byCategory.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ top: 8, right: 8, left: -18, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf3" />
                <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Average']} contentStyle={{ border: 0, borderRadius: 12, boxShadow: '0 12px 28px rgba(15,23,42,0.12)' }} />
                <Bar dataKey="average" name="Average" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Typography color="text.secondary" sx={{ p: 2 }}>No category data is available yet.</Typography>}
        </ChartPanel>
      </Grid>
    </Grid>
  );
}

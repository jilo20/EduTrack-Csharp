import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
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

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toPercent(value) {
  const number = toFiniteNumber(value);
  return number !== null && number >= 0 && number <= 100 ? number : null;
}

function isUnauthorized(error) {
  return /\b401\b|\b403\b|unauthori[sz]ed|forbidden/i.test(error?.message ?? '');
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: 'divider', borderRadius: 3, height: '100%', minHeight: 340 }}>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{subtitle}</Typography>}
      {children}
    </Paper>
  );
}

export default function StudentAnalyticsCharts() {
  const theme = useTheme();
  const studentId = getCurrentUser()?.id;
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    if (studentId == null) {
      setAnalytics(null);
      setError('Your student account is missing an ID. Sign in again to load performance charts.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setAnalytics(null);
    try {
      const result = await getStudentAnalytics(studentId);
      if (!result || typeof result !== 'object') throw new Error('Invalid analytics response.');
      setAnalytics(result);
    } catch (loadError) {
      setError(isUnauthorized(loadError)
        ? 'Your session may have expired or your account cannot view these analytics. Sign in again and retry.'
        : 'We could not load your performance charts. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const trend = useMemo(() => (
    Array.isArray(analytics?.trend)
      ? analytics.trend
        .filter((item) => item && item.name != null && toPercent(item.score) !== null)
        .map((item) => ({ ...item, score: toPercent(item.score) }))
      : []
  ), [analytics]);
  const byCategory = useMemo(() => (
    Array.isArray(analytics?.byCategory)
      ? analytics.byCategory
        .filter((item) => item && item.type != null && toPercent(item.average) !== null)
        .map((item) => ({ ...item, average: toPercent(item.average) }))
      : []
  ), [analytics]);

  const trendChartWidth = trend.length > 5 ? Math.max(480, trend.length * 88) : '100%';
  const categoryChartWidth = byCategory.length > 4 ? Math.max(420, byCategory.length * 100) : '100%';

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 220 }}>
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress aria-label="Loading student analytics" />
          <Typography variant="body2" color="text.secondary">Loading performance analytics...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={loadAnalytics} disabled={loading}>Retry</Button>}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <ChartPanel title="Performance Over Time" subtitle="Recorded assessment scores in chronological order">
          {trend.length ? (
            <Box sx={{ width: '100%', height: 260, mt: 2, overflowX: 'auto', overflowY: 'hidden' }} role="group" aria-label="Line chart of recorded assessment scores over time">
              <Box sx={{ width: trendChartWidth, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 8, right: 16, left: -16, bottom: 30 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={trend.length > 5 ? -25 : 0}
                      textAnchor={trend.length > 5 ? 'end' : 'middle'}
                      height={trend.length > 5 ? 55 : 30}
                      tickFormatter={(value) => String(value).length > 14 ? `${String(value).slice(0, 13)}…` : value}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                      label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Score']}
                      contentStyle={{ border: 0, borderRadius: 12, boxShadow: theme.shadows[4] }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      dot={{ r: 4, fill: theme.palette.primary.main, stroke: theme.palette.background.paper, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 3 }}>No recorded performance trend is available yet.</Typography>
          )}
        </ChartPanel>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <ChartPanel title="Category Mastery" subtitle="Average score by assessment category">
          {byCategory.length ? (
            <Box sx={{ width: '100%', height: 260, mt: 2, overflowX: 'auto', overflowY: 'hidden' }} role="group" aria-label="Bar chart of average score by assessment category">
              <Box sx={{ width: categoryChartWidth, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} margin={{ top: 8, right: 8, left: -18, bottom: 8 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="type" axisLine={false} tickLine={false} interval={0} tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                      label={{ value: 'Average (%)', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Average']}
                      contentStyle={{ border: 0, borderRadius: 12, boxShadow: theme.shadows[4] }}
                    />
                    <Bar dataKey="average" name="Average" fill={theme.palette.secondary.main} radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 3 }}>No category performance data is available yet.</Typography>
          )}
        </ChartPanel>
      </Grid>
    </Grid>
  );
}

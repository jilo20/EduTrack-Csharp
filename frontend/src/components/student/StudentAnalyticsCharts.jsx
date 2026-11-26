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
import { displayLabel } from '../../theme';
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

const PLOT_HEIGHT = 204;

function formatAxisLabel(value) {
  const label = String(value);
  return label.length > 14 ? label.slice(0, 13) + '\u2026' : label;
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', height: '100%' }}>
      <Typography variant="h6" sx={{ fontSize: 15 }}>{title}</Typography>
      {subtitle && <Typography variant="caption" component="p" color="text.secondary">{subtitle}</Typography>}
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

  const trendMinWidth = 110 + trend.length * 82;
  const categoryMinWidth = 56 + byCategory.length * 88;

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
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <ChartPanel title="Performance Over Time" subtitle="Recorded assessment scores by date">
          {trend.length ? (
            <Box sx={{ width: '100%', mt: 1, overflowX: 'auto' }} role="group" aria-label="Line chart of recorded assessment scores over time">
              <Box sx={{ minWidth: trendMinWidth, height: PLOT_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      padding={{ left: 35, right: 35 }}
                      height={24}
                      tickFormatter={formatAxisLabel}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      width={52}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                      label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: theme.palette.text.secondary }}
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
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>No recorded performance trend is available yet.</Typography>
          )}
        </ChartPanel>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <ChartPanel title="Category Mastery" subtitle="Average score by assessment category">
          {byCategory.length ? (
            <Box sx={{ width: '100%', mt: 1, overflowX: 'auto' }} role="group" aria-label="Bar chart of average score by assessment category">
              <Box sx={{ minWidth: categoryMinWidth, height: PLOT_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="type" axisLine={false} tickLine={false} interval={0} height={24} tickFormatter={(value) => formatAxisLabel(displayLabel(value))} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                    <YAxis
                      domain={[0, 100]}
                      width={52}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                      label={{ value: 'Average (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: theme.palette.text.secondary }}
                    />
                    <Tooltip
                      labelFormatter={displayLabel}
                      formatter={(value) => [`${value}%`, 'Average']}
                      contentStyle={{ border: 0, borderRadius: 12, boxShadow: theme.shadows[4] }}
                    />
                    <Bar dataKey="average" name="Average" fill={theme.palette.secondary.main} radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>No category performance data is available yet.</Typography>
          )}
        </ChartPanel>
      </Grid>
    </Grid>
  );
}

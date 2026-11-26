import { metricIconSx, metricValueSx } from '../../theme';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import { Link as RouterLink } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getCurrentUser } from '../../api/client';
import { getTeacherAnalytics } from '../../api/analytics';

function MetricCard({ label, value, icon, color }) {
  return (
    <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={metricIconSx(color)}>{icon}</Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
            <Typography sx={metricValueSx}>{value ?? '—'}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function parseRate(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function percentageOrNull(value) {
  const parsed = parseRate(value);
  return parsed !== null && parsed >= 0 && parsed <= 100 ? parsed : null;
}

function RateRow({ label, value, color }) {
  const rate = percentageOrNull(value);
  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.7 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={700}>{rate === null ? '—' : `${rate}%`}</Typography>
      </Stack>
      {rate === null ? (
        <Typography variant="caption" color="text.secondary">Rate unavailable</Typography>
      ) : (
        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, rate))}
          color={color}
          sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
        />
      )}
    </Box>
  );
}

function ClassNameTick({ x, y, payload, fill }) {
  const name = String(payload?.value ?? 'Class');
  const label = name.length > 20 ? `${name.slice(0, 19)}…` : name;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{name}</title>
      <text x={-8} y={0} textAnchor="end" dominantBaseline="central" fill={fill} fontSize={11} fontWeight={600}>{label}</text>
    </g>
  );
}

function teacherGreeting(user) {
  const name = user?.firstName || user?.name?.trim().split(/\s+/)[0];
  return name ? `Welcome back, ${name}.` : 'Welcome back.';
}

export default function TeacherDashboardPage() {
  const theme = useTheme();
  const user = getCurrentUser();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    if (user?.id == null) {
      setAnalytics(null);
      setError('Your teacher account is missing an ID, so dashboard data cannot be loaded.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setAnalytics(null);
    try {
      const result = await getTeacherAnalytics(user.id);
      if (!result || typeof result !== 'object') throw new Error('Invalid analytics response.');
      setAnalytics(result);
    } catch (loadError) {
      setAnalytics(null);
      setError(/\b401\b|\b403\b|unauthori[sz]ed|forbidden/i.test(loadError?.message ?? '')
        ? 'Your session may have expired or your account cannot view these class analytics. Sign in as a teacher and retry.'
        : 'We could not load class analytics. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const totals = analytics?.totals ?? {};
  const classes = Array.isArray(analytics?.classes) ? analytics.classes.filter(Boolean) : [];
  const chartClasses = classes.filter((item) => item.name && percentageOrNull(item.average) !== null);
  const chartHeight = Math.max(232, chartClasses.length * 48);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' }, justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="pageTitle">Instructor Insights</Typography>
          <Typography variant="body2" color="primary.main" fontWeight={600}>{teacherGreeting(user)}</Typography>
          <Typography variant="pageDescription" color="text.secondary">Class performance and student engagement at a glance.</Typography>
        </Box>
        <Button component={RouterLink} to="/dashboard/attendance" startIcon={<EventAvailableOutlined />} sx={{ borderRadius: 2, fontWeight: 500
         }}>
          Manage Attendance
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadAnalytics} disabled={loading}>Retry</Button>}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard label="Active Classes" value={totals.classes} icon={<SchoolOutlined />} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard label="Students" value={totals.students} icon={<PeopleAltOutlined />} color="secondary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard label="Assessments" value={totals.assessments} icon={<AssignmentOutlined />} color="success" />
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Class Achievement</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>Average grade by class</Typography>
            <Box sx={{ height: 232, mt: 1.5, overflowY: chartHeight > 232 ? 'auto' : 'hidden' }}>
              {loading ? <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading class achievement" /></Box> : error ? (
                <Typography color="text.secondary" sx={{ p: 2 }}>Class performance data is unavailable until analytics load successfully.</Typography>
              ) : classes.length === 0 ? (
                <Typography color="text.secondary" sx={{ p: 2 }}>No classes assigned yet.</Typography>
              ) : chartClasses.length === 0 ? (
                <Typography color="text.secondary" sx={{ p: 2 }}>Average grade data is not available for your classes yet.</Typography>
              ) : (
                <Box sx={{ height: chartHeight, minHeight: 232 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartClasses} layout="vertical" margin={{ top: 8, right: 18, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                      <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={142} axisLine={false} tickLine={false} tick={<ClassNameTick fill={theme.palette.text.secondary} />} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Average']} contentStyle={{ border: 0, borderRadius: 12, boxShadow: theme.shadows[4] }} />
                      <Bar dataKey="average" name="Average" fill={theme.palette.primary.main} radius={[0, 6, 6, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6">Class Snapshot</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 2 }}>Passing and attendance rates for your classes</Typography>
            {loading ? <Box sx={{ height: 250, display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading class snapshot" /></Box> : error ? (
              <Typography color="text.secondary">Class snapshots are unavailable until analytics load successfully.</Typography>
            ) : classes.length ? (
              <Stack spacing={2}>
                {classes.map((item) => (
                  <Box key={item.classId ?? item.name} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1.8 }}>
                      <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{item.name || 'Class'}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Average {percentageOrNull(item.average) === null ? '—' : `${percentageOrNull(item.average)}%`}</Typography>
                    </Stack>
                    <Stack spacing={1.6}>
                      <RateRow label="Passing rate" value={item.passingRate} color="primary" />
                      <RateRow label="Attendance" value={item.attendanceRate} color="success" />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : <Typography color="text.secondary">No classes assigned.</Typography>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

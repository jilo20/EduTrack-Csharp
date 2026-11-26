import { metricValueSx } from '../../theme';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import ClassOutlined from '@mui/icons-material/ClassOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAdminAnalytics } from '../../api/analytics';

const STAT_CARDS = [
  { label: 'Total Students', key: 'students', icon: <PeopleAltOutlined />, color: 'primary' },
  { label: 'Faculty Members', key: 'teachers', icon: <SchoolOutlined />, color: 'secondary' },
  { label: 'Active Classes', key: 'classes', icon: <ClassOutlined />, color: 'success' },
  { label: 'Active Users', key: 'activeUsers', icon: <GroupOutlined />, color: 'warning' },
];

function StatCard({ label, value, icon, color }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 3 },
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={{ p: 1.4, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main`, display: 'flex' }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {label}
            </Typography>
            <Typography sx={metricValueSx}>
              {value ?? '—'}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartPanel({ title, subtitle, children, sx }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', ...sx }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{subtitle}</Typography>}
      <Box sx={{ width: '100%', height: 232, mt: 1.5 }}>{children}</Box>
    </Paper>
  );
}

function isUnauthorized(error) {
  return /\b401\b|\b403\b|unauthori[sz]ed|forbidden/i.test(error?.message ?? '');
}

export default function AdminDashboardPage() {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminAnalytics();
      setAnalytics(result && typeof result === 'object' ? result : null);
    } catch (loadError) {
      setAnalytics(null);
      setError(isUnauthorized(loadError)
        ? 'Your session may have expired or your account cannot view administrator analytics. Sign in with an administrator account and retry.'
        : 'We could not load administrator analytics. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const totals = analytics?.totals ?? {};
  const enrollment = Array.isArray(analytics?.enrollmentPerClass) ? analytics.enrollmentPerClass.filter(Boolean) : [];
  const performance = Array.isArray(analytics?.performance) ? analytics.performance.filter(Boolean) : [];
  const attendanceData = analytics?.attendance && typeof analytics.attendance === 'object' ? analytics.attendance : null;
  const attendance = Object.entries(attendanceData ?? {})
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([name, value]) => ({ name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`, value }));
  const chartColors = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="pageTitle">
          System Overview
        </Typography>
        <Typography variant="pageDescription" color="text.secondary">
          Institutional enrollment and performance at a glance.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadAnalytics} disabled={loading}>Retry</Button>}>{error}</Alert>}

      <Grid container spacing={2}>
        {STAT_CARDS.map((stat) => (
          <Grid key={stat.key} size={{ xs: 12, sm: 6, xl: 3 }}>
            <StatCard label={stat.label} icon={stat.icon} color={stat.color} value={totals[stat.key]} />
          </Grid>
        ))}

        <Grid size={{ xs: 12, lg: 7 }}>
          <ChartPanel title="Enrollment Analytics" subtitle="Students enrolled in each class">
            {loading ? <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading enrollment analytics" /></Box> : error ? (
              <Typography color="text.secondary" sx={{ mt: 3 }}>Enrollment data is unavailable until analytics load successfully.</Typography>
            ) : enrollment.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 3 }}>No enrollment data is available yet.</Typography>
            ) : (
              <Box sx={{ width: '100%', height: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
                <Box sx={{ width: enrollment.length > 7 ? `${Math.max(680, enrollment.length * 88)}px` : '100%', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={enrollment} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 600 }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                      <Tooltip formatter={(value) => [value, 'Students']} contentStyle={{ border: 0, borderRadius: 12, boxShadow: theme.shadows[4] }} />
                      <Bar dataKey="students" name="Students" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} maxBarSize={46} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
          </ChartPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartPanel title="Performance Distribution" subtitle="Student counts by performance band">
            {loading ? <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading performance distribution" /></Box> : error ? (
              <Typography color="text.secondary" sx={{ mt: 3 }}>Performance data is unavailable until analytics load successfully.</Typography>
            ) : performance.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 3 }}>No performance distribution data is available yet.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={performance} dataKey="count" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={3}>
                    {performance.map((item, index) => (
                      <Cell key={item.name ?? index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ border: 0, borderRadius: 12, boxShadow: theme.shadows[4] }} />
                  <Legend verticalAlign="bottom" height={42} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Attendance Overview</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 2 }}>Attendance breakdown from the analytics service.</Typography>
            {loading ? <CircularProgress size={24} aria-label="Loading attendance overview" /> : error ? (
              <Typography color="text.secondary">Attendance data is unavailable until analytics load successfully.</Typography>
            ) : attendance.length ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {attendance.map((item, index) => (
                  <Box key={item.name} sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{item.name}</Typography>
                    <Typography sx={metricValueSx} color={[theme.palette.primary.main, theme.palette.warning.main, theme.palette.error.main][index % 3]}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : <Typography color="text.secondary">No attendance data available.</Typography>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

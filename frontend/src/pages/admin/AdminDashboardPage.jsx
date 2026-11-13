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
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ p: 1.4, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main`, display: 'flex' }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>
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
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: 'divider', borderRadius: 3, minHeight: 360, ...sx }}>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{subtitle}</Typography>}
      <Box sx={{ width: '100%', height: 280, mt: 2 }}>{children}</Box>
    </Paper>
  );
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAnalytics(await getAdminAnalytics());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const totals = analytics?.totals ?? {};
  const enrollment = analytics?.enrollmentPerClass ?? [];
  const performance = analytics?.performance ?? [];
  const attendance = Object.entries(analytics?.attendance ?? {}).map(([name, value]) => ({
    name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
    value,
  }));
  const chartColors = ['primary.main', 'secondary.main', 'success.main', 'warning.main', 'error.main'];

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.7px' }}>
          System Overview
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Institutional enrollment and performance at a glance.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadAnalytics}>Retry</Button>}>{error}</Alert>}

      <Grid container spacing={2.5}>
        {STAT_CARDS.map((stat) => (
          <Grid key={stat.key} size={{ xs: 12, sm: 6, xl: 3 }}>
            <StatCard {...stat} value={totals[stat.key]} />
          </Grid>
        ))}

        <Grid size={{ xs: 12, lg: 7 }}>
          <ChartPanel title="Enrollment Analytics" subtitle="Students enrolled in each class">
            {loading ? <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollment} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ border: 0, borderRadius: 12, boxShadow: '0 12px 28px rgba(15,23,42,0.12)' }} />
                  <Bar dataKey="students" name="Students" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={46} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartPanel title="Performance Distribution" subtitle="Student counts by performance band">
            {loading ? <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={performance} dataKey="count" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={3}>
                    {performance.map((item, index) => (
                      <Cell key={item.name} fill={['#2563eb', '#7c3aed', '#16a34a', '#f59e0b', '#ef4444'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ border: 0, borderRadius: 12, boxShadow: '0 12px 28px rgba(15,23,42,0.12)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={800}>Attendance Overview</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 2.5 }}>Attendance breakdown from the analytics service.</Typography>
            {loading ? <CircularProgress size={24} /> : attendance.length ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {attendance.map((item, index) => (
                  <Box key={item.name} sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{item.name}</Typography>
                    <Typography variant="h5" fontWeight={800} color={['primary.main', 'warning.main', 'error.main'][index % 3]}>
                      {item.value}%
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

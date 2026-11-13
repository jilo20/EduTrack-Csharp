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
    <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ p: 1.4, display: 'flex', borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main` }}>{icon}</Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
            <Typography variant="h4" fontWeight={800}>{value ?? '—'}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function RateRow({ label, value, color }) {
  const rate = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.7 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={700}>{value ?? '—'}%</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={rate}
        color={color}
        sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
      />
    </Box>
  );
}

export default function TeacherDashboardPage() {
  const user = getCurrentUser();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    if (user?.id == null) {
      setError('Your teacher account is missing an ID, so dashboard data cannot be loaded.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setAnalytics(await getTeacherAnalytics(user.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load class analytics.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const totals = analytics?.totals ?? {};
  const classes = analytics?.classes ?? [];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={2} sx={{ mb: 3.5 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.7px' }}>Instructor Insights</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Class performance and student engagement at a glance.</Typography>
        </Box>
        <Button component={RouterLink} to="/dashboard/attendance" startIcon={<EventAvailableOutlined />} sx={{ borderRadius: 2, fontWeight: 700 }}>
          Manage Attendance
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadAnalytics}>Retry</Button>}>{error}</Alert>}

      <Grid container spacing={2.5}>
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
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: 'divider', borderRadius: 3, minHeight: 380 }}>
            <Typography variant="h6" fontWeight={800}>Class Achievement</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>Average grade by class</Typography>
            <Box sx={{ height: 290, mt: 2 }}>
              {loading ? <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> : classes.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classes} layout="vertical" margin={{ top: 8, right: 18, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8edf3" />
                    <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Average']} contentStyle={{ border: 0, borderRadius: 12, boxShadow: '0 12px 28px rgba(15,23,42,0.12)' }} />
                    <Bar dataKey="average" name="Average" fill="#2563eb" radius={[0, 6, 6, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Typography color="text.secondary" sx={{ p: 2 }}>No class performance data available.</Typography>}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: 'divider', borderRadius: 3, height: '100%', minHeight: 380 }}>
            <Typography variant="h6" fontWeight={800}>Class Snapshot</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 2 }}>Passing and attendance rates for your classes</Typography>
            {loading ? <Box sx={{ height: 250, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> : classes.length ? (
              <Stack spacing={2.5}>
                {classes.map((item) => (
                  <Box key={item.classId ?? item.name} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1} sx={{ mb: 1.8 }}>
                      <Typography fontWeight={800}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Average {item.average ?? '—'}%</Typography>
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

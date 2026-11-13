import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import { Link as RouterLink } from 'react-router-dom';
import StudentAnalyticsCharts from '../../components/student/StudentAnalyticsCharts';
import { getCurrentUser } from '../../api/client';
import { getStudentDashboard } from '../../api/students';

function SummaryCard({ title, value, detail, icon, color, progress }) {
  return (
    <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{ p: 1.4, display: 'flex', borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main` }}>{icon}</Box>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>{title}</Typography>
        </Stack>
        <Typography variant="h4" fontWeight={800}>{value}</Typography>
        {detail && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{detail}</Typography>}
        {Number.isFinite(progress) && (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progress))}
            color={color}
            sx={{ mt: 1.6, height: 7, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentDashboardPage() {
  const user = getCurrentUser();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (user?.id == null) {
      setError('Your student account is missing an ID, so dashboard data cannot be loaded.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setDashboard(await getStudentDashboard(user.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Student';
  const classes = dashboard?.classes ?? [];
  const latestScores = dashboard?.latestScores ?? [];
  const latest = latestScores[0];
  const latestValue = latest ? `${latest.score ?? '—'} / ${latest.perfectScore ?? '—'}` : '—';

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.7px' }}>
          Hello, {firstName}!
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>Your personalized academic performance and progress.</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadDashboard}>Retry</Button>}>{error}</Alert>}

      {loading ? (
        <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <SummaryCard
                title="General Weighted Average"
                value={dashboard?.equivalentGrade ?? '—'}
                detail={`Overall score: ${dashboard?.gwa ?? '—'}%`}
                icon={<TrendingUpOutlined />}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <SummaryCard
                title="Attendance Rate"
                value={`${dashboard?.attendanceRate ?? '—'}%`}
                detail="Recorded attendance"
                icon={<EventAvailableOutlined />}
                color="success"
                progress={dashboard?.attendanceRate}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <SummaryCard title="Enrolled Classes" value={classes.length} detail="Current classes" icon={<SchoolOutlined />} color="secondary" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <SummaryCard
                title="Latest Assessment"
                value={latestValue}
                detail={latest?.assessment || 'No recent scores'}
                icon={<AssignmentOutlined />}
                color="warning"
              />
            </Grid>
          </Grid>

          <StudentAnalyticsCharts />

          <Grid container spacing={2.5} sx={{ mt: 0.1 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', height: '100%' }}>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>My Classes</Typography>
                    <Typography variant="body2" color="text.secondary">Your current course progress</Typography>
                  </Box>
                  <Button component={RouterLink} to="/dashboard/performance" variant="outlined" size="small" sx={{ borderRadius: 2, flexShrink: 0 }}>
                    View Performance
                  </Button>
                </Box>
                <Divider />
                {classes.length ? classes.map((item, index) => (
                  <Box key={item.id ?? item.sectionCode ?? item.name}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 800 }}>{item.name?.[0] ?? 'C'}</Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.sectionCode}{item.teacher ? ` · ${item.teacher}` : ''}
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="primary" fontWeight={800}>{item.grade ?? '—'}%</Typography>
                    </Stack>
                    {index < classes.length - 1 && <Divider />}
                  </Box>
                )) : <Typography color="text.secondary" sx={{ p: 3 }}>No enrolled classes are available.</Typography>}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', height: '100%' }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6" fontWeight={800}>Latest Scores</Typography>
                  <Typography variant="body2" color="text.secondary">Recently graded assessments</Typography>
                </Box>
                <Divider />
                {latestScores.length ? latestScores.map((item, index) => (
                  <Box key={`${item.assessment}-${index}`}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ p: 2.5 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>{item.assessment}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>{item.className}</Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={800} color="primary" sx={{ flexShrink: 0 }}>
                        {item.score ?? '—'} / {item.perfectScore ?? '—'}
                      </Typography>
                    </Stack>
                    {index < latestScores.length - 1 && <Divider />}
                  </Box>
                )) : <Typography color="text.secondary" sx={{ p: 3 }}>No assessment scores are available.</Typography>}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

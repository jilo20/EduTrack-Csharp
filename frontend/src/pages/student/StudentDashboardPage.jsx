import { displayLabel, metricIconSx, metricValueSx } from '../../theme';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { getStudentAttendance } from '../../api/attendance';
import { getCurrentUser } from '../../api/client';
import { getStudentAssessments, getStudentDashboard } from '../../api/students';

function isUnauthorized(error) {
  return /\b401\b|\b403\b|unauthori[sz]ed|forbidden/i.test(error?.message ?? '');
}

function formatName(user) {
  return user?.firstName || user?.name?.trim().split(/\s+/)[0] || 'Student';
}

function asNumber(value) {
  const number = Number(value);
  return value !== null && value !== '' && Number.isFinite(number) ? number : null;
}

function getAssessmentStatus(item) {
  if (item.status) return String(item.status);
  if (item.score != null) return 'Graded';
  return 'Pending';
}

function SummaryCard({ title, value, detail, icon, color, progress, to }) {
  const card = (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        minHeight: 96,
        border: 1,
        borderColor: 'divider',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': to ? { transform: 'translateY(-2px)', boxShadow: 2 } : undefined,
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box sx={metricIconSx(color)}>{icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, fontWeight: 500 }}>{title}</Typography>
            <Typography sx={{ ...metricValueSx, fontWeight: 600 }}>{value}</Typography>
          </Box>
        </Stack>
        {detail && <Typography variant="caption" component="p" color="text.secondary" sx={{ mt: 0.5 }}>{detail}</Typography>}
        {Number.isFinite(progress) && (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progress))}
            color={color}
            sx={{ mt: 0.5, height: 4, borderRadius: 1, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 1 } }}
          />
        )}
      </CardContent>
    </Card>
  );

  return to ? <Box component={RouterLink} to={to} sx={{ display: 'block', height: '100%', color: 'inherit', textDecoration: 'none', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: 1 } }}>{card}</Box> : card;
}

function SectionPanel({ title, subtitle, action, children }) {
  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%', minWidth: 0 }}>
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: 15 }}>{title}</Typography>
          {subtitle && <Typography variant="caption" component="p" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

export default function StudentDashboardPage() {
  const user = getCurrentUser();
  const studentId = user?.id;
  const [dashboard, setDashboard] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [assessments, setAssessments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [attendanceUnavailable, setAttendanceUnavailable] = useState(false);
  const [assessmentsUnavailable, setAssessmentsUnavailable] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (studentId == null) {
      setDashboardError('Your student account is missing an ID. Sign in again to load your dashboard.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setDashboardError('');
    setAttendanceUnavailable(false);
    setAssessmentsUnavailable(false);

    const [dashboardResult, attendanceResult, assessmentsResult] = await Promise.allSettled([
      getStudentDashboard(studentId),
      getStudentAttendance(studentId),
      getStudentAssessments(studentId),
    ]);

    if (dashboardResult.status === 'fulfilled') {
      setDashboard(dashboardResult.value ?? null);
    } else {
      setDashboard(null);
      setDashboardError(isUnauthorized(dashboardResult.reason)
        ? 'Your session may have expired or your account cannot view this dashboard. Sign in again and retry.'
        : 'We could not load your academic dashboard. Check your connection and try again.');
    }

    if (attendanceResult.status === 'fulfilled') setAttendance(attendanceResult.value ?? null);
    else {
      setAttendance(null);
      setAttendanceUnavailable(true);
    }
    if (assessmentsResult.status === 'fulfilled') setAssessments(Array.isArray(assessmentsResult.value) ? assessmentsResult.value : []);
    else {
      setAssessments(null);
      setAssessmentsUnavailable(true);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const classes = Array.isArray(dashboard?.classes) ? dashboard.classes : [];
  const latestScores = Array.isArray(dashboard?.latestScores) ? dashboard.latestScores : [];
  const pendingAssessments = Array.isArray(assessments)
    ? assessments.filter((item) => /pending|upcoming|not submitted|in progress/i.test(getAssessmentStatus(item)))
    : [];
  const attendanceRate = asNumber(dashboard?.attendanceRate) ?? asNumber(attendance?.rate);
  const overallScore = asNumber(dashboard?.gwa);
  const equivalentGrade = dashboard?.equivalentGrade;
  const firstName = formatName(user);

  return (
    <Box>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="pageTitle">Student Dashboard</Typography>
        <Typography variant="pageDescription" color="text.secondary">Welcome, {firstName}. Review your grades, attendance, and assessments.</Typography>
      </Box>

      {dashboardError && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadDashboard} disabled={loading}>Retry</Button>}>{dashboardError}</Alert>}

      {loading ? (
        <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading student dashboard" /></Box>
      ) : dashboardError ? null : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <SummaryCard
                title="General Weighted Average"
                value={equivalentGrade ?? '—'}
                detail={overallScore === null ? 'No overall grade recorded' : `${overallScore}% overall score`}
                icon={<TrendingUpOutlined />}
                color="primary"
                to="/dashboard/performance"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <SummaryCard
                title="Attendance Rate"
                value={attendanceRate === null ? '—' : `${attendanceRate}%`}
                detail={attendanceRate === null ? (attendanceUnavailable ? 'Attendance information is unavailable' : 'No attendance recorded') : 'Recorded attendance'}
                icon={<EventAvailableOutlined />}
                color="success"
                progress={attendanceRate ?? undefined}
                to="/dashboard/my-attendance"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <SummaryCard
                title="Enrolled Classes"
                value={classes.length}
                detail={classes.length === 1 ? 'Current class' : 'Current classes'}
                icon={<SchoolOutlined />}
                color="secondary"
                to="/dashboard/performance"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <SummaryCard
                title="Pending Assessments"
                value={assessments === null ? '—' : pendingAssessments.length}
                detail={assessments === null ? 'Assessment information is unavailable' : pendingAssessments.length ? 'Awaiting completion or grading' : 'No pending assessments'}
                icon={<AssignmentOutlined />}
                color="warning"
                to="/dashboard/assessments"
              />
            </Grid>
          </Grid>

          {/* 11.6: shared charts component (loads its own analytics, has its own loading/error state). */}
          <Box sx={{ mb: 2 }}><StudentAnalyticsCharts /></Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <SectionPanel
                title="My Classes"
                subtitle="Your enrolled course sections"
                action={<Button component={RouterLink} to="/dashboard/performance" variant="outlined">View Performance</Button>}
              >
                {classes.length ? classes.map((item, index) => (
                  <Box key={item.id ?? item.sectionCode ?? item.name}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 1.5, py: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, flexShrink: 0, bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 600, fontSize: 14 }}>{item.name?.[0] ?? 'C'}</Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} sx={{ overflowWrap: 'anywhere' }}>{item.name || 'Class'}</Typography>
                        <Typography variant="caption" component="p" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                          {[item.sectionCode, typeof item.teacher === 'string' ? item.teacher : item.teacher?.name].filter(Boolean).join(' · ') || 'Class details unavailable'}
                        </Typography>
                      </Box>
                      {item.grade != null && <Typography variant="body2" color="primary" fontWeight={600} sx={{ flexShrink: 0 }}>{item.grade}%</Typography>}
                    </Stack>
                    {index < classes.length - 1 && <Divider />}
                  </Box>
                )) : <Typography color="text.secondary" sx={{ p: 1.5 }}>You do not have any enrolled classes yet.</Typography>}
              </SectionPanel>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <SectionPanel
                title="Assessments"
                subtitle="Pending work and recent results"
                action={<Button component={RouterLink} to="/dashboard/assessments" variant="outlined">View All</Button>}
              >
                {assessmentsUnavailable && <Alert severity="info" sx={{ mx: 1.5, mb: 1 }}>Assessment information is currently unavailable.</Alert>}
                {pendingAssessments.length ? pendingAssessments.slice(0, 3).map((item, index) => (
                  <Box key={item.id ?? `${item.title}-${index}`}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 1.5 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} sx={{ overflowWrap: 'anywhere' }}>{item.title || 'Assessment'}</Typography>
                        <Typography variant="caption" component="p" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{item.className || item.type || 'Class details unavailable'}</Typography>
                      </Box>
                      <Chip label={displayLabel(getAssessmentStatus(item))} size="small" color="warning" variant="outlined" sx={{ height: 'auto', minHeight: 24, maxWidth: '45%', flexShrink: 0, '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere' } }} />
                    </Stack>
                    {index < Math.min(pendingAssessments.length, 3) - 1 && <Divider />}
                  </Box>
                )) : assessments === null ? null : assessments.length ? (
                  <Typography color="text.secondary" sx={{ p: 1.5 }}>No pending assessments.</Typography>
                ) : <Typography color="text.secondary" sx={{ p: 1.5 }}>No assessment records are available yet.</Typography>}

                {latestScores.length > 0 && (
                  <>
                    <Divider />
                    <Box sx={{ px: 1.5, pt: 1 }}><Typography variant="subtitle2" component="h3" color="text.secondary">Latest Scores</Typography></Box>
                    {latestScores.slice(0, 2).map((item, index) => (
                      <Box key={`${item.assessment ?? 'score'}-${index}`}>
                        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={500} sx={{ overflowWrap: 'anywhere' }}>{item.assessment || 'Assessment'}</Typography>
                            <Typography variant="caption" component="p" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{item.className || 'Class details unavailable'}</Typography>
                          </Box>
                          <Typography fontWeight={600} color="primary" sx={{ flexShrink: 0 }}>{item.score ?? '—'} / {item.perfectScore ?? '—'}</Typography>
                        </Stack>
                        {index < Math.min(latestScores.length, 2) - 1 && <Divider />}
                      </Box>
                    ))}
                  </>
                )}
              </SectionPanel>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

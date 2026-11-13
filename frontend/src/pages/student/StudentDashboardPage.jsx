import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getStudentAnalytics } from '../../api/analytics';
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
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': to ? { transform: 'translateY(-2px)', boxShadow: 2 } : undefined,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{ p: 1.25, display: 'flex', borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main` }}>{icon}</Box>
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

  return to ? <Box component={RouterLink} to={to} sx={{ display: 'block', height: '100%', color: 'inherit', textDecoration: 'none' }}>{card}</Box> : card;
}

function SectionPanel({ title, subtitle, action, children, sx }) {
  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', height: '100%', ...sx }}>
      <Box sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800}>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>{subtitle}</Typography>}
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

function ChartPanel({ title, children }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, border: 1, borderColor: 'divider', borderRadius: 3, minHeight: 340, height: '100%' }}>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
      {children}
    </Paper>
  );
}

export default function StudentDashboardPage() {
  const user = getCurrentUser();
  const studentId = user?.id;
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [assessments, setAssessments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [analyticsUnavailable, setAnalyticsUnavailable] = useState(false);
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
    setAnalyticsUnavailable(false);
    setAttendanceUnavailable(false);
    setAssessmentsUnavailable(false);

    const [dashboardResult, analyticsResult, attendanceResult, assessmentsResult] = await Promise.allSettled([
      getStudentDashboard(studentId),
      getStudentAnalytics(studentId),
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

    if (analyticsResult.status === 'fulfilled') setAnalytics(analyticsResult.value ?? null);
    else {
      setAnalytics(null);
      setAnalyticsUnavailable(true);
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
  const trend = Array.isArray(analytics?.trend) ? analytics.trend : [];
  const categories = useMemo(() => (
    Array.isArray(analytics?.byCategory)
      ? analytics.byCategory.map((item) => ({ subject: item.type, mastery: item.average })).filter((item) => item.subject && asNumber(item.mastery) !== null)
      : []
  ), [analytics]);
  const pendingAssessments = Array.isArray(assessments)
    ? assessments.filter((item) => /pending|upcoming|not submitted|in progress/i.test(getAssessmentStatus(item)))
    : [];
  const attendanceRate = asNumber(dashboard?.attendanceRate) ?? asNumber(attendance?.rate);
  const overallScore = asNumber(dashboard?.gwa);
  const equivalentGrade = dashboard?.equivalentGrade;
  const firstName = formatName(user);

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" fontWeight={800} color="primary" sx={{ letterSpacing: '-0.7px' }}>
          Hello, {firstName}!
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>Your personalized academic performance and growth tracker.</Typography>
      </Box>

      {dashboardError && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadDashboard} disabled={loading}>Retry</Button>}>{dashboardError}</Alert>}

      {loading ? (
        <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading student dashboard" /></Box>
      ) : dashboardError ? null : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <SummaryCard
                title="General Weighted Average"
                value={equivalentGrade ?? '—'}
                detail={overallScore === null ? 'No overall grade recorded' : `${overallScore}% overall score`}
                icon={<TrendingUpOutlined />}
                color="primary"
                to="/dashboard/performance"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
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
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <SummaryCard
                title="Enrolled Classes"
                value={classes.length}
                detail={classes.length === 1 ? 'Current class' : 'Current classes'}
                icon={<SchoolOutlined />}
                color="secondary"
                to="/dashboard/performance"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
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

          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <ChartPanel title="Performance Over Time">
                {analyticsUnavailable ? <Typography color="text.secondary" sx={{ mt: 3 }}>Performance information is currently unavailable.</Typography> : trend.length ? (
                  <Box sx={{ width: '100%', height: 270, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend} margin={{ top: 8, right: 16, left: -16, bottom: 6 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Score']} contentStyle={{ border: 0, borderRadius: 12, boxShadow: '0 12px 28px rgba(15,23,42,0.12)' }} />
                        <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                ) : <Typography color="text.secondary" sx={{ mt: 3 }}>No performance trend is available yet.</Typography>}
              </ChartPanel>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <ChartPanel title="Category Mastery">
                {analyticsUnavailable ? <Typography color="text.secondary" sx={{ mt: 3 }}>Category information is currently unavailable.</Typography> : categories.length ? (
                  <Box sx={{ width: '100%', height: 270, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={categories}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Mastery" dataKey="mastery" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.35} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Average']} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : <Typography color="text.secondary" sx={{ mt: 3 }}>No category performance is available yet.</Typography>}
              </ChartPanel>
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <SectionPanel
                title="My Classes"
                subtitle="Your enrolled course sections"
                action={<Button component={RouterLink} to="/dashboard/performance" variant="outlined" size="small" sx={{ borderRadius: 2, flexShrink: 0 }}>View Performance</Button>}
              >
                {classes.length ? classes.map((item, index) => (
                  <Box key={item.id ?? item.sectionCode ?? item.name}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: { xs: 2, sm: 2.5 } }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 800 }}>{item.name?.[0] ?? 'C'}</Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>{item.name || 'Class'}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {[item.sectionCode, typeof item.teacher === 'string' ? item.teacher : item.teacher?.name].filter(Boolean).join(' · ') || 'Class details unavailable'}
                        </Typography>
                      </Box>
                      {item.grade != null && <Typography variant="h6" color="primary" fontWeight={800} sx={{ flexShrink: 0 }}>{item.grade}%</Typography>}
                    </Stack>
                    {index < classes.length - 1 && <Divider />}
                  </Box>
                )) : <Typography color="text.secondary" sx={{ p: 2.5 }}>You do not have any enrolled classes yet.</Typography>}
              </SectionPanel>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <SectionPanel
                title="Assessments"
                subtitle="Pending work and recent results"
                action={<Button component={RouterLink} to="/dashboard/assessments" variant="outlined" size="small" sx={{ borderRadius: 2, flexShrink: 0 }}>View All</Button>}
              >
                {assessmentsUnavailable && <Alert severity="info" sx={{ mx: 2.5, mb: 1 }}>Assessment information is currently unavailable.</Alert>}
                {pendingAssessments.length ? pendingAssessments.slice(0, 3).map((item, index) => (
                  <Box key={item.id ?? `${item.title}-${index}`}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ p: 2.5 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>{item.title || 'Assessment'}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>{item.className || item.type || 'Class details unavailable'}</Typography>
                      </Box>
                      <Chip label={getAssessmentStatus(item)} size="small" color="warning" variant="outlined" sx={{ fontWeight: 700, flexShrink: 0 }} />
                    </Stack>
                    {index < Math.min(pendingAssessments.length, 3) - 1 && <Divider />}
                  </Box>
                )) : assessments === null ? null : assessments.length ? (
                  <Typography color="text.secondary" sx={{ p: 2.5 }}>No pending assessments. Keep up the good work!</Typography>
                ) : <Typography color="text.secondary" sx={{ p: 2.5 }}>No assessment records are available yet.</Typography>}

                {latestScores.length > 0 && (
                  <>
                    <Divider />
                    <Box sx={{ px: 2.5, pt: 2 }}><Typography variant="subtitle2" color="text.secondary" fontWeight={800}>LATEST SCORES</Typography></Box>
                    {latestScores.slice(0, 2).map((item, index) => (
                      <Box key={`${item.assessment ?? 'score'}-${index}`}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ p: 2.5, pt: 1.5 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{item.assessment || 'Assessment'}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>{item.className || 'Class details unavailable'}</Typography>
                          </Box>
                          <Typography fontWeight={800} color="primary" sx={{ flexShrink: 0 }}>{item.score ?? '—'} / {item.perfectScore ?? '—'}</Typography>
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

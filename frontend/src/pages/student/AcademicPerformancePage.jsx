import { metricIconSx, metricValueSx } from '../../theme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import ClassOutlined from '@mui/icons-material/ClassOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import { getCurrentUser } from '../../api/client';
import { getStudentDashboard, getStudentPerformance } from '../../api/students';

function isUnauthorized(error) {
  return /\b401\b|\b403\b|unauthori[sz]ed|forbidden/i.test(error?.message ?? '');
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function className(item) {
  return item.className || item.name || 'Class';
}

function categoriesFor(item) {
  return Array.isArray(item.categories) ? item.categories : [];
}

function SummaryCard({ title, value, detail, icon, color }) {
  return (
    <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <Box sx={metricIconSx(color)}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        </Stack>
        <Typography sx={metricValueSx}>{value}</Typography>
        {detail && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{detail}</Typography>}
      </CardContent>
    </Card>
  );
}

function CategoryRow({ category }) {
  const average = numberOrNull(category.average);
  const weight = numberOrNull(category.weight);
  const equivalentGrade = category.equivalentGrade;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Typography variant="body2" fontWeight={700}>
          {category.type || 'Category'}
          {weight !== null && <Typography component="span" variant="caption" color="text.secondary"> ({weight}% weight)</Typography>}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
          {equivalentGrade != null && <Typography variant="body2" fontWeight={800}>{equivalentGrade}</Typography>}
          <Typography variant="body2" fontWeight={800} color="primary.main">{average === null ? 'No grade' : `${average}%`}</Typography>
        </Stack>
      </Stack>
      {average !== null && (
        <LinearProgress
          variant="determinate"
          value={Math.max(0, Math.min(100, average))}
          sx={{ height: 7, borderRadius: 4, mt: 0.8, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
        />
      )}
    </Box>
  );
}

function ClassPerformanceCard({ item }) {
  const grade = numberOrNull(item.grade);
  const categories = categoriesFor(item);
  const teacher = typeof item.teacher === 'string' ? item.teacher : item.teacher?.name;
  const sectionCode = item.sectionCode || item.section;
  const equivalentGrade = item.equivalentGrade;
  const description = item.description || item.gradeDescription;
  const term = [item.schoolYear, item.semester].filter(Boolean).join(' · ');

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between', mb: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box sx={{ p: 1.25, display: 'flex', borderRadius: 2, bgcolor: 'primary.light', color: 'primary.dark', flexShrink: 0 }}><ClassOutlined /></Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" component="h2">{className(item)}</Typography>
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                {sectionCode && <Chip label={sectionCode} size="small" variant="outlined" sx={{ fontWeight: 700 }} />}
                {teacher && <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>{teacher}</Typography>}
                {term && <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>{term}</Typography>}
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
            {equivalentGrade != null && <Chip label={`Equivalent ${equivalentGrade}`} color="primary" sx={{ fontWeight: 800 }} />}
            {grade !== null && <Chip label={`${grade}%`} variant="outlined" sx={{ fontWeight: 800 }} />}
          </Stack>
        </Stack>

        {description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>}
        {grade !== null && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={700}>Overall Grade</Typography>
              <Typography variant="body2" fontWeight={800}>{grade}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, grade))} sx={{ height: 9, borderRadius: 5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 5 } }} />
          </Box>
        )}

        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.75 }}>Category Breakdown</Typography>
          {categories.length ? (
            <Stack spacing={1.75}>{categories.map((category, index) => <CategoryRow key={category.type || index} category={category} />)}</Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No category grade information is available for this class yet.</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AcademicPerformancePage() {
  const studentId = getCurrentUser()?.id;
  const [performance, setPerformance] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState('');
  const [summaryUnavailable, setSummaryUnavailable] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  const loadPerformance = useCallback(async () => {
    if (studentId == null) {
      setPerformanceError('Your student account is missing an ID. Sign in again to view your academic performance.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setPerformanceError('');
    setSummaryUnavailable(false);
    const [performanceResult, dashboardResult] = await Promise.allSettled([
      getStudentPerformance(studentId),
      getStudentDashboard(studentId),
    ]);

    if (performanceResult.status === 'fulfilled') {
      setPerformance(Array.isArray(performanceResult.value) ? performanceResult.value : []);
    } else {
      setPerformance([]);
      setPerformanceError(isUnauthorized(performanceResult.reason)
        ? 'Your session may have expired or your account cannot view these grades. Sign in again and retry.'
        : 'We could not load your academic performance. Check your connection and try again.');
    }

    if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value ?? null);
    else {
      setDashboard(null);
      setSummaryUnavailable(true);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => { loadPerformance(); }, [loadPerformance]);

  const filteredPerformance = useMemo(() => {
    const query = search.trim().toLowerCase();
    return performance.filter((item) => {
      const matchesClass = classFilter === 'all' || String(item.classId) === String(classFilter);
      const searchable = [className(item), item.sectionCode, item.section, item.teacher, item.description, ...categoriesFor(item).map((category) => category.type)];
      const matchesSearch = !query || searchable.some((value) => String(value ?? '').toLowerCase().includes(query));
      return matchesClass && matchesSearch;
    });
  }, [performance, search, classFilter]);

  const gradedClasses = performance.filter((item) => numberOrNull(item.grade) !== null).length;
  const overallGrade = numberOrNull(dashboard?.gwa);

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="pageTitle">Academic Performance</Typography>
        <Typography variant="pageDescription" color="text.secondary">Review your class grades and assessment category breakdowns.</Typography>
      </Box>

      {performanceError && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadPerformance} disabled={loading}>Retry</Button>}>{performanceError}</Alert>}

      {loading ? (
        <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading academic performance" /></Box>
      ) : !performanceError && (
        <>
          {summaryUnavailable && <Alert severity="info" sx={{ mb: 2 }}>Your overall GWA summary is currently unavailable. Class grades are shown below where available.</Alert>}

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title="Overall GWA"
                value={overallGrade === null ? '—' : `${overallGrade}%`}
                detail={dashboard?.equivalentGrade != null ? `Equivalent grade: ${dashboard.equivalentGrade}` : overallGrade === null ? 'No overall grade recorded' : 'Based on your academic summary'}
                icon={<TrendingUpOutlined />}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <SummaryCard
                title="Classes with Grades"
                value={`${gradedClasses} / ${performance.length}`}
                detail="Class results currently available from your academic record"
                icon={<CalculateOutlined />}
                color="secondary"
              />
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider' }}>
            <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="performance-class-filter-label">Filter by Class</InputLabel>
                  <Select
                    labelId="performance-class-filter-label"
                    label="Filter by Class"
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.target.value)}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    <MenuItem value="all">All Classes</MenuItem>
                    {performance.map((item, index) => <MenuItem key={item.classId ?? index} value={item.classId}>{className(item)}{item.sectionCode ? ` (${item.sectionCode})` : ''}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  placeholder="Search classes or categories..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined color="action" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search academic performance' } }} />
              </Grid>
            </Grid>
          </Paper>

          {performance.length === 0 ? (
            <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, border: 1, borderColor: 'divider', textAlign: 'center' }}>
              <ClassOutlined color="disabled" sx={{ fontSize: 32 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>No class performance available</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>Your class grades will appear here when they are available.</Typography>
            </Paper>
          ) : filteredPerformance.length ? (
            <Grid container spacing={2}>
              {filteredPerformance.map((item, index) => (
                <Grid key={item.classId ?? `${className(item)}-${index}`} size={{ xs: 12, lg: 6 }}>
                  <ClassPerformanceCard item={item} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography fontWeight={700}>No classes match your search or filter.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Adjust the class filter or search terms and try again.</Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}

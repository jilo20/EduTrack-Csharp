// OWNER: Lopez, Mary Vincent — WBS 8.7 Grading Hub
import { useCallback, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { getRoster, updateWeights } from '../../api/classes';
import { createAssessment, submitScores } from '../../api/assessments';
import FeatureDataState from '../../components/common/FeatureDataState';
import { useFeatureData, useTeachingClasses } from '../../components/common/featureData';

export default function GradingHubPage() {
  const classes = useTeachingClasses();
  const [classId, setClassId] = useState('');
  const section = classes.data?.find((c) => c.id === Number(classId));
  return <Stack spacing={3}>
    <Typography variant="h4">Grading Hub</Typography>
    <Typography color="text.secondary">Create assessments, encode scores, and manage category weights.</Typography>
    <FeatureDataState {...classes} onRetry={classes.refresh} empty={classes.data?.length === 0} emptyMessage="You have no classes yet.">
      <TextField select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}>
        {(classes.data || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.sectionCode})</MenuItem>)}
      </TextField>
      {section ? <GradingWorkspace key={section.id} section={section} /> : <Alert severity="info">Select a class to begin.</Alert>}
    </FeatureDataState>
  </Stack>;
}

function GradingWorkspace({ section }) {
  const loader = useCallback(() => getRoster(section.id), [section.id]);
  const roster = useFeatureData(loader);
  return <FeatureDataState {...roster} onRetry={roster.refresh}>
    {roster.data && <GradingEditor section={section} roster={roster.data} />}
  </FeatureDataState>;
}

function GradingEditor({ section, roster }) {
  const [assessments, setAssessments] = useState(roster.assessments || []);
  const [students, setStudents] = useState(roster.students || []);
  const [assessmentId, setAssessmentId] = useState('');
  const [scores, setScores] = useState({});
  const [weights, setWeights] = useState(section.weights || {});
  const [weightDraft, setWeightDraft] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const assessment = assessments.find((a) => a.id === Number(assessmentId));
  const completed = section.status === 'completed';
  const invalidScores = assessment && Object.values(scores).some((value) =>
    value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > assessment.perfectScore));
  const weightTotal = weightDraft ? Object.values(weightDraft).reduce((sum, v) => sum + Number(v || 0), 0) : 0;
  const invalidWeights = weightDraft && Object.values(weightDraft).some((v) => v === '' || !Number.isInteger(Number(v)) || Number(v) < 0 || Number(v) > 100);

  function selectAssessment(id) {
    setAssessmentId(id); setError(''); setNotice('');
    setScores(Object.fromEntries(students.map((s) => [s.id, s.scores?.[id] ?? ''])));
  }
  async function saveScores() {
    setError(''); setNotice('');
    const entries = students.filter((s) => scores[s.id] !== '' && scores[s.id] != null)
      .map((s) => ({ studentId: s.id, score: Number(scores[s.id]) }));
    if (!entries.length || invalidScores) { setError('Enter at least one score between zero and the perfect score.'); return; }
    setSaving(true);
    try {
      await submitScores(assessment.id, entries);
      setStudents((rows) => rows.map((s) => ({ ...s, scores: { ...s.scores, ...(scores[s.id] !== '' ? { [assessment.id]: Number(scores[s.id]) } : {}) } })));
      setNotice('Scores saved. Blank fields are left unchanged.');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }
  async function addAssessment(e) {
    e.preventDefault(); setError(''); setNotice('');
    if (draft.title.trim().length < 3) { setError('Use at least 3 characters for the title.'); return; }
    setSaving(true);
    try {
      const created = await createAssessment({ sectionId: section.id, title: draft.title.trim(), type: draft.type, perfectScore: Number(draft.perfectScore) });
      setAssessments((rows) => [...rows, created]); setDraft(null);
      setAssessmentId(created.id); setScores(Object.fromEntries(students.map((s) => [s.id, ''])));
      setNotice('Assessment created.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function saveWeights(e) {
    e.preventDefault(); setError(''); setNotice('');
    if (weightTotal !== 100 || invalidWeights) { setError('Use whole percentages between 0 and 100, totaling 100%.'); return; }
    setSaving(true);
    try {
      const values = Object.fromEntries(Object.entries(weightDraft).map(([k, v]) => [k, Number(v)]));
      await updateWeights(section.id, values); setWeights(values); setWeightDraft(null); setNotice('Grading weights updated.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <Stack spacing={2}>
    {completed && <Alert severity="info">This semester has ended. Scores and weights are read-only.</Alert>}
    {error && !draft && !weightDraft && <Alert severity="error">{error}</Alert>}
    {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Button variant="contained" disabled={completed || saving || !Object.keys(weights).length} onClick={() => { setError(''); setDraft({ title: '', type: Object.keys(weights)[0], perfectScore: 100 }); }}>Add assessment</Button>
      <Button variant="outlined" disabled={completed || saving} onClick={() => { setError(''); setWeightDraft({ ...weights }); }}>Edit weights</Button>
    </Stack>
    <Typography variant="body2" color="text.secondary">{Object.entries(weights).map(([k, v]) => k + ': ' + v + '%').join(' · ')}</Typography>
    <TextField select label="Assessment" value={assessmentId} disabled={saving || assessments.length === 0} onChange={(e) => selectAssessment(e.target.value)}>
      {assessments.map((a) => <MenuItem key={a.id} value={a.id}>{a.title} · {a.type} · /{a.perfectScore}</MenuItem>)}
    </TextField>
    <FeatureDataState empty={!assessments.length} emptyMessage="Create the first assessment for this class.">
      {assessment && <FeatureDataState empty={!students.length} emptyMessage="No students are enrolled in this class.">
        <TableContainer component={Paper}><Table aria-label="Assessment scores">
          <TableHead><TableRow><TableCell>Student</TableCell><TableCell>ID number</TableCell><TableCell>Score / {assessment.perfectScore}</TableCell></TableRow></TableHead>
          <TableBody>{students.map((s) => <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{s.idNumber}</TableCell><TableCell>
            <TextField type="number" size="small" label={`Score for ${s.name}`} value={scores[s.id] ?? ''} disabled={completed || saving}
              error={scores[s.id] !== '' && scores[s.id] != null && (!Number.isFinite(Number(scores[s.id])) || Number(scores[s.id]) < 0 || Number(scores[s.id]) > assessment.perfectScore)}
              helperText={scores[s.id] !== '' && scores[s.id] != null && (!Number.isFinite(Number(scores[s.id])) || Number(scores[s.id]) < 0 || Number(scores[s.id]) > assessment.perfectScore)
                ? `Enter 0 to ${assessment.perfectScore}.` : undefined}
              slotProps={{ htmlInput: { min: 0, max: assessment.perfectScore, step: 'any' } }}
              onChange={(e) => setScores((rows) => ({ ...rows, [s.id]: e.target.value }))} />
          </TableCell></TableRow>)}</TableBody>
        </Table></TableContainer>
        <Typography variant="body2" color="text.secondary">Leave a blank field to keep its existing score. Blank fields do not record a zero.</Typography>
        <Button variant="contained" disabled={completed || saving || invalidScores} onClick={saveScores}>{saving ? 'Saving…' : 'Save scores'}</Button>
      </FeatureDataState>}
    </FeatureDataState>
    <Dialog open={Boolean(draft)} onClose={() => { if (!saving) setDraft(null); }} fullWidth maxWidth="sm">
      {draft && <Stack component="form" onSubmit={addAssessment}>
        <DialogTitle>Add assessment</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField required label="Title" value={draft.title} disabled={saving} slotProps={{ htmlInput: { minLength: 3, maxLength: 150 } }} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <TextField select label="Category" value={draft.type} disabled={saving} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>{Object.keys(weights).map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}</TextField>
          <TextField required type="number" label="Perfect score" value={draft.perfectScore} disabled={saving} slotProps={{ htmlInput: { min: 1, max: 999, step: 1 } }} onChange={(e) => setDraft({ ...draft, perfectScore: e.target.value })} />
        </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" disabled={saving} variant="contained">Create assessment</Button></DialogActions>
      </Stack>}
    </Dialog>
    <Dialog open={Boolean(weightDraft)} onClose={() => { if (!saving) setWeightDraft(null); }} fullWidth maxWidth="xs">
      <Stack component="form" onSubmit={saveWeights}>
        <DialogTitle>Grading weights</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {Object.entries(weightDraft || {}).map(([k, v]) => <TextField key={k} required type="number" label={k + ' (%)'} value={v} disabled={saving} slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }} onChange={(e) => setWeightDraft({ ...weightDraft, [k]: e.target.value })} />)}
          <Alert severity={weightTotal === 100 && !invalidWeights ? 'success' : 'warning'}>Total: {weightTotal}% (must equal 100%)</Alert>
        </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={() => setWeightDraft(null)}>Cancel</Button><Button type="submit" variant="contained" disabled={saving || invalidWeights || weightTotal !== 100}>Save weights</Button></DialogActions>
      </Stack>
    </Dialog>
  </Stack>;
}

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import CheckCircle from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link as RouterLink } from 'react-router-dom';
import { register, verifyId } from '../../api/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEPS = ['Verify invite', 'Account details'];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [inviteId, setInviteId] = useState('');
  const [assignedRole, setAssignedRole] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    if (isVerifying) return;

    const normalizedId = inviteId.trim();
    if (!normalizedId) {
      setErrors({ inviteId: 'Please enter your invite ID.' });
      setMessage(null);
      return;
    }

    setErrors({});
    setMessage(null);
    setIsVerifying(true);
    try {
      const result = await verifyId(normalizedId);
      if (!result?.valid) {
        setMessage({
          type: 'error',
          text: result?.error || result?.message || 'Invalid invite ID. Please check and try again.',
        });
        return;
      }
      setInviteId(normalizedId);
      setAssignedRole(result.role || '');
      setStep(1);
      setMessage({
        type: 'success',
        text: result.role ? `Invite verified. You are registering as a ${result.role}.` : 'Invite ID verified successfully.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error && error.message
          ? error.message
          : 'Unable to verify your invite ID. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setMessage(null);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (isRegistering) return;

    const nextErrors = {};
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (!firstName) nextErrors.firstName = 'First name is required.';
    if (!lastName) nextErrors.lastName = 'Last name is required.';
    if (!email) nextErrors.email = 'Email address is required.';
    else if (!EMAIL_PATTERN.test(email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);
    setMessage(null);
    if (!inviteId || step !== 1) {
      setStep(0);
      setMessage({ type: 'error', text: 'Verify your invite ID before creating an account.' });
      return;
    }
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsRegistering(true);
    try {
      const result = await register({
        idNumber: inviteId,
        firstName,
        lastName,
        email,
        password: form.password,
      });
      if (!result) throw new Error('Registration did not complete. Please try again.');
      setIsComplete(true);
      setMessage({ type: 'success', text: 'Account created successfully. Sign in with your new account.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error && error.message
          ? error.message
          : 'Unable to create your account. Please try again.',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleBack = () => {
    setStep(0);
    setMessage(null);
    setErrors({});
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        py: { xs: 3, sm: 5 },
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
          top: -100,
          right: -100,
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)',
          bottom: -50,
          left: -50,
          pointerEvents: 'none',
        }}
      />

      <Paper
        elevation={24}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 500,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(2,6,23,0.35)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'inline-flex', p: 1.5, mb: 1.5, borderRadius: 3, bgcolor: 'rgba(37,99,235,0.08)' }}>
            <SchoolIcon sx={{ fontSize: 36, color: '#2563EB' }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={800}
            sx={{
              backgroundImage: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            Join EduTrack
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Create your account to get started
          </Typography>
        </Box>

        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {message && <Alert severity={message.type} sx={{ mb: 2.5, borderRadius: 2 }}>{message.text}</Alert>}

        {step === 0 ? (
          <Box component="form" onSubmit={handleVerify} noValidate>
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                STEP 1: INVITE VERIFICATION
              </Typography>
              <TextField
                label="Invite ID"
                autoComplete="off"
                autoFocus
                value={inviteId}
                onChange={(event) => {
                  setInviteId(event.target.value);
                  setErrors({});
                  setMessage(null);
                }}
                error={Boolean(errors.inviteId)}
                helperText={errors.inviteId}
                disabled={isVerifying}
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><BadgeOutlined color="action" /></InputAdornment>,
                } }} />
              <Button
                type="submit"
                size="large"
                fullWidth
                disabled={isVerifying}
                startIcon={isVerifying ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{
                  py: 1.4,
                  bgcolor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                  '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 6px 20px rgba(37,99,235,0.5)' },
                }}
              >
                {isVerifying ? 'Verifying…' : 'Verify ID'}
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleRegister} noValidate>
            <Stack spacing={2.25}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  STEP 2: ACCOUNT DETAILS
                </Typography>
                {assignedRole && <Typography variant="caption" color="success.main" fontWeight={700}>{assignedRole}</Typography>}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderRadius: 2, bgcolor: 'success.50', color: 'success.dark' }}>
                <CheckCircle fontSize="small" />
                <Typography variant="body2">Invite verified</Typography>
              </Box>

              {isComplete ? (
                <Stack spacing={2}>
                  <Button component={RouterLink} to="/" size="large" fullWidth sx={{ py: 1.4, borderRadius: 2, fontWeight: 700 }}>
                    Go to Sign In
                  </Button>
                </Stack>
              ) : (
                <>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="First Name"
                      name="firstName"
                      autoComplete="given-name"
                      autoFocus
                      value={form.firstName}
                      onChange={handleFormChange}
                      error={Boolean(errors.firstName)}
                      helperText={errors.firstName}
                      disabled={isRegistering}
                    />
                    <TextField
                      label="Last Name"
                      name="lastName"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={handleFormChange}
                      error={Boolean(errors.lastName)}
                      helperText={errors.lastName}
                      disabled={isRegistering}
                    />
                  </Stack>
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleFormChange}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    disabled={isRegistering}
                  />
                  <TextField
                    label="Create Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleFormChange}
                    error={Boolean(errors.password)}
                    helperText={errors.password || 'At least 8 characters.'}
                    disabled={isRegistering}
                    slotProps={{ input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword((visible) => !visible)}
                            edge="end"
                            disabled={isRegistering}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    } }} />
                  <TextField
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleFormChange}
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword}
                    disabled={isRegistering}
                  />
                  <Stack direction="row" spacing={1.5} sx={{ pt: 0.5 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleBack}
                      disabled={isRegistering}
                      sx={{ minWidth: 96, borderRadius: 2, fontWeight: 700 }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      size="large"
                      fullWidth
                      disabled={isRegistering}
                      startIcon={isRegistering ? <CircularProgress size={18} color="inherit" /> : null}
                      sx={{
                        py: 1.35,
                        bgcolor: '#2563EB',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        borderRadius: 2,
                        boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                        '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 6px 20px rgba(37,99,235,0.5)' },
                      }}
                    >
                      {isRegistering ? 'Creating account…' : 'Complete Registration'}
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>
          </Box>
        )}

        <Typography variant="body2" align="center" sx={{ mt: 3 }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/" underline="none" sx={{ color: '#2563EB', fontWeight: 700, '&:hover': { color: '#1d4ed8', textDecoration: 'underline' } }}>
            Sign In
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

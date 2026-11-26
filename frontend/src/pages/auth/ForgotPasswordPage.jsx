/*
 * ==========================================================================
 * FILE:    src/pages/auth/ForgotPasswordPage.jsx
 * OWNER:   Bazar, Angelo
 * WBS:     4.3 Forgot Password
 * PURPOSE: Request a reset link by email, then set a new password from that link.
 * API:     requestPasswordReset, resetPassword (src/api/auth.js)
 *
 * RULE:    Material UI components only. See frontend/README.md.
 * ==========================================================================
 */
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import LockResetOutlined from '@mui/icons-material/LockResetOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { resetPassword, requestPasswordReset } from '../../api/auth';

const STEPS = ['Request link', 'New password'];

// Same look as the Login and Register pages.
const primaryButtonSx = {
  py: 1.4,
  bgcolor: '#2563EB',
  color: '#FFFFFF',
  fontWeight: 700,
  borderRadius: 2,
  boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
  '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 6px 20px rgba(37,99,235,0.5)' },
};
const linkSx = { color: '#2563EB', fontWeight: 700, '&:hover': { color: '#1d4ed8', textDecoration: 'underline' } };

const errorText = (error, fallback) => (error instanceof Error && error.message ? error.message : fallback);

export default function ForgotPasswordPage() {
  const { hash } = useLocation();
  const token = new URLSearchParams(hash.slice(1)).get('token');
  const step = token ? 1 : 0;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    if (busy) return;
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+$/.test(address) || address.length > 50) {
      setErrors({ email: 'Enter the email address on your account.' });
      return;
    }

    setErrors({});
    setMessage(null);
    setBusy(true);
    try {
      await requestPasswordReset(address);
      setMessage({ type: 'success', text: 'If an eligible account exists, we’ll send a reset link.' });
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error, 'Unable to request a reset link. Please try again.') });
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = {};
    if (!password) nextErrors.password = 'Enter a new password.';
    else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    else if (password.length > 100) nextErrors.password = 'Password must be at most 100 characters.';
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your new password.';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    setMessage(null);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      await resetPassword(token, password);
      setIsComplete(true);
      setPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Your password was changed. Sign in with your new password.' });
    } catch (error) {
      setMessage({ type: 'error', text: errorText(error, 'Unable to reset your password. Please try again.') });
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    setErrors({});
    setMessage(null);
  };

  const togglePassword = (
    <InputAdornment position="end">
      <IconButton
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        onClick={() => setShowPassword((visible) => !visible)}
        edge="end"
        disabled={busy}
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: { xs: 3, sm: 5 },
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: '100%',
          maxWidth: 460,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.97)',
          boxShadow: '0 24px 64px rgba(2,6,23,0.35)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'inline-flex', p: 1.5, mb: 1.5, borderRadius: 3, bgcolor: 'rgba(37,99,235,0.08)' }}>
            <LockResetOutlined sx={{ fontSize: 36, color: '#2563EB' }} />
          </Box>
          <Typography variant="h4" component="h1" fontWeight={800} sx={{ color: '#1d4ed8', letterSpacing: '-0.5px' }}>
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {token ? 'Choose a new password' : 'Request a reset link by email'}
          </Typography>
        </Box>

        <Stepper activeStep={isComplete ? 2 : step} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {message && <Alert severity={message.type} sx={{ mb: 2.5, borderRadius: 2 }}>{message.text}</Alert>}

        {step === 0 ? (
          <Box component="form" onSubmit={handleVerify} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="Email address"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors({});
                  setMessage(null);
                }}
                error={Boolean(errors.email)}
                helperText={errors.email}
                disabled={busy}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><BadgeOutlined color="action" /></InputAdornment> } }}
              />
              <Button
                type="submit"
                size="large"
                fullWidth
                disabled={busy}
                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
                sx={primaryButtonSx}
              >
                {busy ? 'Sending…' : 'Send reset link'}
              </Button>
            </Stack>
          </Box>
        ) : isComplete ? (
          <Button component={RouterLink} to="/" size="large" fullWidth sx={primaryButtonSx}>
            Go to Sign In
          </Button>
        ) : (
          <Box component="form" onSubmit={handleReset} noValidate>
            <Stack spacing={2.25}>
              <TextField
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(event) => { setPassword(event.target.value); setErrors((e) => ({ ...e, password: '' })); }}
                error={Boolean(errors.password)}
                helperText={errors.password || 'At least 8 characters.'}
                disabled={busy}
                slotProps={{ input: { endAdornment: togglePassword } }}
              />
              <TextField
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => { setConfirmPassword(event.target.value); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword}
                disabled={busy}
              />
              <Stack direction="row" spacing={1.5} sx={{ pt: 0.5 }}>
                <Button component={RouterLink} to="/forgot-password" variant="outlined" onClick={handleBack} disabled={busy} sx={{ minWidth: 96, borderRadius: 2, fontWeight: 700 }}>
                  Back
                </Button>
                <Button
                  type="submit"
                  size="large"
                  fullWidth
                  disabled={busy}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={primaryButtonSx}
                >
                  {busy ? 'Saving…' : 'Reset Password'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        <Typography variant="body2" align="center" sx={{ mt: 3 }}>
          Remembered it?{' '}
          <Link component={RouterLink} to="/" underline="none" sx={linkSx}>Sign In</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

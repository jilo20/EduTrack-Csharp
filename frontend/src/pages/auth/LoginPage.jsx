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
  TextField,
  Typography,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import SchoolIcon from '@mui/icons-material/School';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { saveSession } from '../../api/client';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = {};
    const normalizedEmail = email.trim();
    if (!normalizedEmail) nextErrors.email = 'Email address is required.';
    else if (!EMAIL_PATTERN.test(normalizedEmail)) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Password is required.';

    setErrors(nextErrors);
    setSubmitError('');
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const session = await login(normalizedEmail, password);
      if (!session?.token || !session?.user) {
        throw new Error('The login response was incomplete. Please try again.');
      }
      saveSession(session.token, session.user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error && error.message
        ? error.message
        : 'Unable to log in. Check your email and password and try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          maxWidth: 440,
          p: { xs: 3.5, sm: 5 },
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(2,6,23,0.35)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 1.5,
              mb: 2,
              borderRadius: 3,
              bgcolor: 'rgba(37,99,235,0.08)',
            }}
          >
            <SchoolIcon sx={{ fontSize: 40, color: '#2563EB' }} />
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
            EduTrack
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Student Performance Management System
          </Typography>
        </Box>

        {submitError && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{submitError}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              id="login-email"
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={Boolean(errors.email)}
              helperText={errors.email}
              disabled={isSubmitting}
            />
            <TextField
              id="login-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={Boolean(errors.password)}
              helperText={errors.password}
              disabled={isSubmitting}
              slotProps={{ input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((visible) => !visible)}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              } }} />
            <Button
              id="login-submit"
              type="submit"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                bgcolor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: '1rem',
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  boxShadow: '0 6px 20px rgba(37,99,235,0.5)',
                },
              }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            <Typography variant="body2" align="center" sx={{ pt: 0.5 }}>
              Don&apos;t have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                underline="none"
                sx={{
                  color: '#2563EB',
                  fontWeight: 'bold',
                  '&:hover': { color: '#1d4ed8', textDecoration: 'underline' },
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

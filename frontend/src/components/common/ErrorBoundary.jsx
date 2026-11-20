/*
 * ==========================================================================
 * FILE:    src/components/common/ErrorBoundary.jsx
 * OWNER:   Uytico, Felleandrei
 * WBS:     14.3 Loading & Error States
 * PURPOSE: Catches a crash in any page and shows a friendly message instead of a blank screen.
 *
 * Catches render errors and offers a way to reload the app.
 *
 * RULE:    Material UI components only. See frontend/README.md.
 * ==========================================================================
 */

import { Component } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error in the application:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box role="alert" sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 560 }}>
          <Alert severity="error">
            <Typography variant="h6">This page ran into a problem.</Typography>
            <Typography>Please reload the app to continue.</Typography>
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </Stack>
      </Box>
    );
  }
}

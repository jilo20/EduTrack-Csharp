/*
 * ==========================================================================
 * FILE:    src/components/common/LoadingState.jsx
 * OWNER:   Uytico, Felleandrei
 * WBS:     14.3 Loading & Error States
 * PURPOSE: Shared loading indicator. Every page uses this while its data loads.
 *
 * Centered spinner with an optional message.
 * MUI:  CircularProgress, Box, Typography
 *
 * RULE:    Material UI components only. See frontend/README.md.
 * ==========================================================================
 */

import { Box, CircularProgress, Stack, Typography } from '@mui/material';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 160, width: '100%' }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <CircularProgress size={24} aria-label="Loading" />
        {message ? <Typography color="text.secondary">{message}</Typography> : null}
      </Stack>
    </Box>
  );
}

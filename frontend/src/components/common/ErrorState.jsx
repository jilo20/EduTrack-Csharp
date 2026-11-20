/*
 * ==========================================================================
 * FILE:    src/components/common/ErrorState.jsx
 * OWNER:   Uytico, Felleandrei
 * WBS:     14.3 Loading & Error States
 * PURPOSE: Shared error message with an optional Retry button.
 *
 * PROPS: message, onRetry
 * MUI:  Alert, Button
 *
 * RULE:    Material UI components only. See frontend/README.md.
 * ==========================================================================
 */

import { Alert, Button } from '@mui/material';

export default function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}

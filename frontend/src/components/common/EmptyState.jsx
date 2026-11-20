/*
 * ==========================================================================
 * FILE:    src/components/common/EmptyState.jsx
 * OWNER:   Uytico, Felleandrei
 * WBS:     14.3 Loading & Error States
 * PURPOSE: Shared "nothing here yet" message for empty lists and tables.
 *
 * PROPS: title, description
 * MUI:  Box, Typography
 *
 * RULE:    Material UI components only. See frontend/README.md.
 * ==========================================================================
 */

import { Box, Typography } from '@mui/material';

export default function EmptyState({ title = 'Nothing here yet', description }) {
  return (
    <Box role="status" sx={{ py: 5, textAlign: 'center' }}>
      <Typography variant="h6">{title}</Typography>
      {description ? (
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}

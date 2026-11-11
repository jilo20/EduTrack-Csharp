/*
 * The ONE place for colors, fonts, and spacing.
 * Never write a hex color inside a page. Use the theme: color="primary", sx={{ color: 'text.secondary' }}.
 */
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#00897b' },
    background: { default: '#f5f7fa' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Roboto, "Segoe UI", Arial, sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { variant: 'contained', disableElevation: true } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
  },
});

export default theme;

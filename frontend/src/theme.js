import { alpha, createTheme } from '@mui/material/styles';

const branding = {
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#00897b' },
    background: { default: '#f5f7fa' },
  },
  shape: { borderRadius: 10 },
};
const fontFamily = 'Roboto, "Segoe UI", Arial, sans-serif';

// Keep the pre-refinement Material UI defaults on the authentication screens.
export const authTheme = createTheme({
  ...branding,
  typography: { fontFamily, h5: { fontWeight: 600 }, h6: { fontWeight: 600 } },
  components: {
    MuiButton: { defaultProps: { variant: 'contained', disableElevation: true } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
  },
});

const foundation = createTheme({
  ...branding,
  palette: {
    ...branding.palette,
    text: { primary: '#17263a', secondary: '#4e6075' },
    divider: '#dce4ee',
  },
  typography: {
    fontFamily,
    pageTitle: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.25, marginBottom: 4 },
    pageDescription: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.45 },
    h5: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.35 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.35 },
    subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '0.875rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.45 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    button: { fontSize: '0.8125rem', fontWeight: 500, textTransform: 'none' },
  },
});

const { palette, shape } = foundation;
const focusRing = { outline: `2px solid ${palette.primary.main}`, outlineOffset: 2 };

export const metricValueSx = {
  fontSize: '1.5rem', lineHeight: 1.15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
};

export const metricIconSx = (color) => (theme) => ({
  display: 'grid',
  placeItems: 'center',
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: 1,
  color: theme.palette[color].dark,
  bgcolor: alpha(theme.palette[color].main, 0.1),
  '& .MuiSvgIcon-root': { fontSize: 22 },
});

export function displayLabel(value) {
  return String(value ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => /^(id|ids|gwa|api|pdf|csv)$/i.test(word)
      ? word.toUpperCase()
      : word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default createTheme(foundation, {
  components: {
    MuiTypography: { defaultProps: { variantMapping: { pageTitle: 'h1', pageDescription: 'p', h5: 'h2', h6: 'h2', subtitle1: 'p', subtitle2: 'p', body1: 'p', body2: 'p' } } },
    MuiButton: {
      defaultProps: { variant: 'contained', disableElevation: true },
      styleOverrides: {
        root: { minHeight: 36, paddingInline: 14, '&.Mui-focusVisible': focusRing },
        sizeSmall: { minHeight: 32, paddingInline: 10, fontSize: '0.8125rem' },
        sizeLarge: { minHeight: 40 },
        startIcon: { marginRight: 6, '& > *:first-of-type': { fontSize: 18 } },
        endIcon: { marginLeft: 6, '& > *:first-of-type': { fontSize: 18 } },
      },
    },
    MuiIconButton: {
      defaultProps: { size: 'small' },
      styleOverrides: { root: { width: 36, height: 36, '& .MuiSvgIcon-root': { fontSize: 20 }, '&.Mui-focusVisible': focusRing } },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true, variant: 'outlined' } },
    MuiFormControl: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { minHeight: 40, backgroundColor: palette.background.paper },
        notchedOutline: { borderColor: palette.divider },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: '0.875rem' } } },
    MuiFormHelperText: { styleOverrides: { root: { marginInline: 0 } } },
    MuiInputAdornment: { styleOverrides: { root: { '& .MuiSvgIcon-root': { fontSize: 18 } } } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiCardContent: { styleOverrides: { root: { padding: 16, '&:last-child': { paddingBottom: 16 } } } },
    MuiTableContainer: {
      styleOverrides: { root: { maxWidth: '100%', overflowX: 'auto', border: `1px solid ${palette.divider}`, borderRadius: shape.borderRadius } },
    },
    MuiTableHead: { styleOverrides: { root: { backgroundColor: palette.background.default } } },
    MuiTableRow: {
      styleOverrides: { root: { '.MuiTableBody-root &:hover': { backgroundColor: alpha(palette.primary.main, 0.036) } } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { height: 46, padding: '5px 14px', fontSize: '0.8125rem', overflowWrap: 'anywhere', borderColor: palette.divider },
        head: { height: 42, fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', color: palette.text.secondary },
        alignRight: { fontVariantNumeric: 'tabular-nums' },
      },
    },
    MuiChip: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: { root: { height: 26, fontSize: '0.75rem', fontWeight: 600 }, label: { paddingInline: 9 } },
    },
    MuiDialog: { styleOverrides: { paper: { margin: 16, maxHeight: 'calc(100% - 32px)' } } },
    MuiDialogTitle: { styleOverrides: { root: { padding: '16px 20px 12px' } } },
    MuiDialogContent: { styleOverrides: { root: { paddingInline: 20 } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '12px 20px 16px', flexWrap: 'wrap', gap: 8, '& > :not(style) ~ :not(style)': { marginLeft: 0 } } } },
    MuiTabs: { styleOverrides: { root: { minHeight: 40 } } },
    MuiTab: { styleOverrides: { root: { minHeight: 40, paddingBlock: 8 } } },
    MuiTooltip: { defaultProps: { arrow: true }, styleOverrides: { tooltip: { fontSize: '0.75rem' } } },
    MuiTablePagination: { styleOverrides: { toolbar: { minHeight: 48, flexWrap: 'wrap' } } },
    MuiPaginationItem: { styleOverrides: { root: { fontVariantNumeric: 'tabular-nums' } } },
    MuiAlert: { styleOverrides: { root: { alignItems: 'center', padding: '4px 12px' }, action: { paddingTop: 0 } } },
    MuiDrawer: { styleOverrides: { paper: { borderRadius: 0 } } },
    MuiListItemButton: { styleOverrides: { root: { '&.Mui-focusVisible': { ...focusRing, outlineOffset: -2 } } } },
    MuiToolbar: { styleOverrides: { regular: { minHeight: 60, '@media (min-width: 600px)': { minHeight: 60 } } } },
  },
});

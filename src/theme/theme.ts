import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          primary: {
            main: '#0252a1', // Darker blue for contrast
          },
          secondary: {
            main: '#9c27b0',
          },
          error: {
            main: '#d32f2f',
          },
          warning: {
            main: '#ed6c02',
          },
          info: {
            main: '#0288d1',
          },
          success: {
            main: '#2e7d32',
          },
          background: {
            default: '#f8fafc',
            paper: '#ffffff',
          },
          text: {
            primary: '#0f172a',
            secondary: '#475569',
          }
        }
      : {
          // palette values for dark mode
          primary: {
            main: '#90caf9',
          },
          secondary: {
            main: '#ce93d8',
          },
          error: {
            main: '#f44336',
          },
          warning: {
            main: '#ffa726',
          },
          info: {
            main: '#29b6f6',
          },
          success: {
            main: '#66bb6a',
          },
          background: {
            default: '#0f172a',
            paper: '#1e293b',
          },
          text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
          }
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
            boxShadow: '0 0 0 1000px #ffffff inset !important',
            WebkitTextFillColor: '#0f172a !important',
            caretColor: '#0f172a',
            transition: 'background-color 50000s ease-in-out 0s',
          },
        },
      },
    },
  },
});

// A default theme for the ThemeProvider. 
// Can be updated later with a custom hook using useMediaQuery for prefers-color-scheme.
const theme = createTheme(getDesignTokens('light'));

export default theme;

import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { ROUTES } from '../../constants';
import { useLogin } from '../../hooks';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { TextField, InputAdornment, IconButton, Button, Alert, Link, Box } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { formState, setField, submit, loading, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayout title="Welcome back" subtitle="Enter your credentials to access your workspace">
      <form onSubmit={submit} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} role="alert">
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
          <TextField
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            autoFocus
            required
            fullWidth
            value={formState.email}
            onChange={(e) => setField('email', e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={20} />
                  </InputAdornment>
                ),
              }
            }}
          />
          
          <Box>
            <TextField
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              fullWidth
              value={formState.password}
              onChange={(e) => setField('password', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2" color="primary" sx={{ textDecoration: 'none', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </Box>
          </Box>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          endIcon={loading ? undefined : <ArrowRight size={20} />}
          sx={{ py: 1.5, borderRadius: 2 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Loader2 className="animate-spin" size={20} />
              Signing in...
            </Box>
          ) : (
            'Sign in'
          )}
        </Button>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Link component={RouterLink} to={ROUTES.AUTH.REGISTER} variant="body2" color="text.secondary" sx={{ textDecoration: 'none' }}>
            Don't have an organization account yet? <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>Register your Organization</Box>
          </Link>
        </Box>
      </form>
    </AuthLayout>
  );
};

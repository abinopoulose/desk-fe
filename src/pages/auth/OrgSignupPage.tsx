import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { ROUTES } from '../../constants';
import { useOrgSignup } from '../../hooks';
import { AuthLayout } from '../../components/layout/AuthLayout';
import {
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Alert,
  Link,
  Box,
  LinearProgress,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Building2, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length > 7) strength += 25;
  if (password.match(/[A-Z]/)) strength += 25;
  if (password.match(/[0-9]/)) strength += 25;
  if (password.match(/[^A-Za-z0-9]/)) strength += 25;
  return strength;
};

const getStrengthColor = (strength: number) => {
  if (strength === 0) return 'inherit';
  if (strength <= 25) return 'error';
  if (strength <= 50) return 'warning';
  if (strength <= 75) return 'info';
  return 'success';
};

const lightInputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#ffffff',
    borderRadius: 2,
    color: '#0f172a',
    fontSize: '0.875rem',
    '& fieldset': {
      borderColor: '#cbd5e1',
    },
    '&:hover fieldset': {
      borderColor: '#6366f1',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#6366f1',
      borderWidth: 1.5,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#94a3b8',
    opacity: 1,
  },
};

export const OrgSignupPage: React.FC = () => {
  const { formState, setField, submit, loading, error } = useOrgSignup();
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = getPasswordStrength(formState.password);

  return (
    <AuthLayout
      title="Register your Organization"
      subtitle="Create an account to start managing your workspace"
      maxWidth={480}
    >
      <form onSubmit={submit} noValidate>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              bgcolor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              '& .MuiAlert-icon': { color: '#ef4444' },
            }}
            role="alert"
          >
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3.5 }}>
          {/* Organization Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Organization Name
            </label>
            <TextField
              id="name"
              type="text"
              autoFocus
              required
              fullWidth
              placeholder="Acme Corporation"
              value={formState.name}
              onChange={(e) => setField('name', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={lightInputSx}
            />
          </div>

          {/* Admin Full Name */}
          <div>
            <label
              htmlFor="adminFullName"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Admin Full Name
            </label>
            <TextField
              id="adminFullName"
              type="text"
              autoComplete="name"
              required
              fullWidth
              placeholder="Jane Doe"
              value={formState.adminFullName}
              onChange={(e) => setField('adminFullName', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <User className="w-4 h-4 text-slate-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={lightInputSx}
            />
          </div>

          {/* Admin Email address */}
          <div>
            <label
              htmlFor="adminEmail"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Admin Email Address
            </label>
            <TextField
              id="adminEmail"
              type="email"
              autoComplete="email"
              required
              fullWidth
              placeholder="admin@company.com"
              value={formState.adminEmail}
              onChange={(e) => setField('adminEmail', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={lightInputSx}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Password
            </label>
            <TextField
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              fullWidth
              placeholder="••••••••••••"
              value={formState.password}
              onChange={(e) => setField('password', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: '#64748b', '&:hover': { color: '#0f172a' } }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={lightInputSx}
            />
            {formState.password && (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  color={getStrengthColor(passwordStrength)}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    bgcolor: '#e2e8f0',
                    mb: 0.75,
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                    Password strength:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color:
                        passwordStrength <= 25
                          ? '#f87171'
                          : passwordStrength <= 50
                          ? '#fbbf24'
                          : passwordStrength <= 75
                          ? '#60a5fa'
                          : '#34d399',
                    }}
                  >
                    {passwordStrength <= 25 && 'Weak'}
                    {passwordStrength > 25 && passwordStrength <= 50 && 'Fair'}
                    {passwordStrength > 50 && passwordStrength <= 75 && 'Good'}
                    {passwordStrength > 75 && 'Strong'}
                  </Typography>
                </Box>
              </Box>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Confirm Password
            </label>
            <TextField
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              fullWidth
              placeholder="••••••••••••"
              value={formState.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={lightInputSx}
            />
          </div>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          endIcon={loading ? undefined : <ArrowRight size={18} />}
          sx={{
            py: 1.5,
            borderRadius: 2.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.875rem',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338ca 0%, #2563eb 100%)',
              boxShadow: '0 6px 16px rgba(79, 70, 229, 0.45)',
            },
            '&:disabled': {
              background: '#e2e8f0',
              color: '#94a3b8',
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Loader2 className="animate-spin" size={18} />
              <span>Registering...</span>
            </Box>
          ) : (
            'Create Organization'
          )}
        </Button>

        <Box sx={{ mt: 3.5, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to={ROUTES.AUTH.LOGIN}
              sx={{
                color: '#4f46e5',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { color: '#4338ca', textDecoration: 'underline' },
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </form>
    </AuthLayout>
  );
};
export default OrgSignupPage;

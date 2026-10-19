import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router';
import { ROUTES, APP_NAME } from '../../constants';
import { useLogin } from '../../hooks';
import { AuthLayout } from '../../components/layout/AuthLayout';
import {
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Alert,
  Link,
  Checkbox,
  FormControlLabel,
  Box,
} from '@mui/material';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getSubdomain } from '../../utils/subdomain';
import { resolveOrganization, type OrganizationDTO } from '../../api/organizationApi';
import { useAuthStore } from '../../store/authStore';
import { tokenStorage } from '../../utils/tokenStorage';

export const LoginPage: React.FC = () => {
  const { formState, setField, submit, loading, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const currentSubdomain = getSubdomain();
  const [tenantOrg, setTenantOrg] = useState<OrganizationDTO | null>(null);
  const [tenantError, setTenantError] = useState<string | null>(null);

  // If user visits root login, ensure root storage doesn't carry stale tenant session
  useEffect(() => {
    if (!currentSubdomain && tokenStorage.getToken()) {
      tokenStorage.clearAll();
      useAuthStore.getState().logout();
    }
  }, [currentSubdomain]);

  useEffect(() => {
    if (currentSubdomain) {
      resolveOrganization(currentSubdomain)
        .then((res) => {
          setTenantOrg(res.data);
          setTenantError(null);
        })
        .catch(() => {
          setTenantError(`Workspace "${currentSubdomain}" was not found. Please check your domain URL.`);
        });
    }
  }, [currentSubdomain]);

  // Load saved email if previously remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem('desk_remembered_email');
    if (savedEmail) {
      setField('email', savedEmail);
    }
  }, [setField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rememberMe && formState.email) {
      localStorage.setItem('desk_remembered_email', formState.email);
    } else {
      localStorage.removeItem('desk_remembered_email');
    }
    await submit(e);
  };

  const title = tenantOrg ? `Welcome to ${tenantOrg.name}` : `Sign in to ${APP_NAME}`;
  const subtitle = tenantOrg
    ? `Sign in with your ${tenantOrg.domain || currentSubdomain} email to access this workspace.`
    : 'Enter your work email and password to access your account.';

  return (
    <AuthLayout title={title} subtitle={subtitle} maxWidth={440}>
      {/* Workspace Indicator Pill if on tenant subdomain */}
      {currentSubdomain && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>Workspace: <strong className="text-white capitalize">{tenantOrg?.name || currentSubdomain}</strong></span>
          </div>
        </Box>
      )}

      {/* Tenant Error Alert */}
      {tenantError && (
        <Alert
          severity="warning"
          variant="filled"
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: 'rgba(245, 158, 11, 0.15)',
            color: '#fcd34d',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            '& .MuiAlert-icon': { color: '#f59e0b' },
          }}
        >
          {tenantError}
        </Alert>
      )}

      {/* Form Error Alert */}
      {error && (
        <Alert
          severity="error"
          variant="filled"
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            '& .MuiAlert-icon': { color: '#ef4444' },
          }}
          role="alert"
        >
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
          {/* Work Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Work Email
            </label>
            <TextField
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              placeholder="name@company.com"
              value={formState.email}
              onChange={(e) => setField('email', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 2,
                  color: 'white',
                  fontSize: '0.875rem',
                  '& fieldset': { borderColor: 'rgba(51, 65, 85, 0.8)' },
                  '&:hover fieldset': { borderColor: '#6366f1' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 1.5 },
                },
                '& .MuiInputBase-input::placeholder': { color: '#64748b', opacity: 1 },
              }}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Password
              </label>
              <Link
                component={RouterLink}
                to={ROUTES.AUTH.FORGOT_PASSWORD}
                variant="caption"
                sx={{
                  color: '#818cf8',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Forgot password?
              </Link>
            </div>
            <TextField
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
                        sx={{ color: '#94a3b8' }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 2,
                  color: 'white',
                  fontSize: '0.875rem',
                  '& fieldset': { borderColor: 'rgba(51, 65, 85, 0.8)' },
                  '&:hover fieldset': { borderColor: '#6366f1' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 1.5 },
                },
                '& .MuiInputBase-input::placeholder': { color: '#64748b', opacity: 1 },
              }}
            />
          </div>

          {/* Remember Me Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                size="small"
                sx={{
                  color: '#64748b',
                  '&.Mui-checked': { color: '#6366f1' },
                }}
              />
            }
            label={
              <span className="text-xs text-slate-400 select-none">
                Remember work email on this device
              </span>
            }
          />
        </Box>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            py: 1.35,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '0.9rem',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.35)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338ca 0%, #2563eb 100%)',
              boxShadow: '0 6px 20px 0 rgba(79, 70, 229, 0.5)',
            },
            '&:disabled': {
              background: 'rgba(51, 65, 85, 0.5)',
              color: '#94a3b8',
            },
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </Button>

        {/* Register Organization CTA (Only on root / non-tenant domain) */}
        {!currentSubdomain && (
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(51, 65, 85, 0.6)', textAlign: 'center' }}>
            <span className="text-xs text-slate-400">
              Need a new workspace?{' '}
              <Link
                component={RouterLink}
                to={ROUTES.AUTH.REGISTER}
                sx={{
                  color: '#818cf8',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Register organization
              </Link>
            </span>
          </Box>
        )}
      </form>
    </AuthLayout>
  );
};

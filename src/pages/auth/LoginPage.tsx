import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router';
import { ROUTES } from '../../constants';
import { useLogin } from '../../hooks';
import {
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Alert,
  Link,
  Checkbox,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Layers,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getSubdomain, buildTenantUrl } from '../../utils/subdomain';
import { resolveOrganization, type OrganizationDTO } from '../../api/organizationApi';
import { useAuthStore } from '../../store/authStore';

export const LoginPage: React.FC = () => {
  const { formState, setField, submit, loading, error } = useLogin();
  const { isAuthenticated, user, token } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const currentSubdomain = getSubdomain();
  const [tenantOrg, setTenantOrg] = useState<OrganizationDTO | null>(null);
  const [tenantError, setTenantError] = useState<string | null>(null);

  // If already authenticated and visiting root login, redirect to workspace
  useEffect(() => {
    const firmSubdomain = user?.organizationSubdomain;
    if (isAuthenticated && firmSubdomain && !currentSubdomain) {
      window.location.href = buildTenantUrl(firmSubdomain, ROUTES.DASHBOARD, token || undefined);
    }
  }, [isAuthenticated, user, token, currentSubdomain]);

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

  const handleQuickFill = (email: string, pass: string) => {
    setField('email', email);
    setField('password', pass);
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* LEFT COLUMN: Hero Brand Showcase (Visible on md and up) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-r border-slate-800/60 overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">Desk</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Service Cloud
              </span>
            </div>
            <p className="text-xs text-slate-400">Enterprise Service Management & Ticketing</p>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-12 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/70 text-xs font-medium text-indigo-300 mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next-Gen Enterprise IT & Operations Desk</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
              Streamline service operations{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">
                with intelligent automation
              </span>
            </h1>

            <p className="text-base text-slate-300 leading-relaxed mb-8">
              A unified platform for service catalogs, dynamic request workflows, SLA tracking, and hierarchical organizational governance.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Dynamic Forms & Catalog</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conditional schema builder with custom validation and real-time form previews.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">SLA Breach Mitigation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time response & resolution timers with automated escalation tiers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Granular RBAC Security</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Firm-scoped access control with fine-grained department and role permissions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Interactive Org Charts</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Complete reporting tree visualization with instant manager hierarchy lookup.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Metrics / Trust Bar */}
        <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">All Systems Operational</span>
          </div>
          <div>Multi-Tenant Enterprise Isolation • ISO 27001 Ready</div>
        </div>
      </div>

      {/* RIGHT COLUMN: Sign In Card */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-slate-900/40 relative">
        {/* Subtle background glow for right side */}
        <div className="absolute top-1/4 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10"
        >
          {/* Mobile Header Logo (Visible on small screens) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Desk</span>
              <p className="text-xs text-slate-400">Service Management</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            {currentSubdomain && (
              <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span>Workspace: <strong className="text-white capitalize">{tenantOrg?.name || currentSubdomain}</strong></span>
              </div>
            )}

            <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">
              {tenantOrg ? `Welcome to ${tenantOrg.name}` : 'Welcome back'}
            </h2>
            <p className="text-sm text-slate-400">
              {tenantOrg
                ? `Sign in with your ${tenantOrg.domain || currentSubdomain} email to access this workspace.`
                : 'Sign in with your organization email to access your workspace.'}
            </p>
          </div>

          {tenantError && (
            <div className="mb-5">
              <Alert
                severity="warning"
                variant="filled"
                sx={{
                  borderRadius: 2,
                  bgcolor: 'rgba(245, 158, 11, 0.15)',
                  color: '#fcd34d',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  '& .MuiAlert-icon': { color: '#f59e0b' },
                }}
              >
                {tenantError}
              </Alert>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5"
            >
              <Alert
                severity="error"
                variant="filled"
                sx={{
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
            </motion.div>
          )}

          {/* Quick Demo Credentials Helper */}
          <div className="mb-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="text-xs truncate">
                <span className="text-slate-400">Dev Admin: </span>
                <span className="text-slate-200 font-mono">abinopoulose@abino.in</span>
              </div>
            </div>
            <Tooltip title="Auto-fill developer admin credentials for quick testing" arrow>
              <Button
                size="small"
                variant="text"
                onClick={() => handleQuickFill('abinopoulose@abino.in', 'password123')}
                sx={{
                  fontSize: '11px',
                  textTransform: 'none',
                  py: 0.25,
                  px: 1,
                  minWidth: 'auto',
                  color: '#818cf8',
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 1.5,
                  '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.2)' },
                }}
              >
                Auto-fill
              </Button>
            </Tooltip>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4 mb-6">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Work Email Address
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
                      '& fieldset': {
                        borderColor: 'rgba(51, 65, 85, 0.8)',
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
                      color: '#64748b',
                      opacity: 1,
                    },
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
                    to="/forgot-password"
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
                      '& fieldset': {
                        borderColor: 'rgba(51, 65, 85, 0.8)',
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
                      color: '#64748b',
                      opacity: 1,
                    },
                  }}
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="pt-1">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size="small"
                      sx={{
                        color: '#64748b',
                        '&.Mui-checked': {
                          color: '#6366f1',
                        },
                      }}
                    />
                  }
                  label={
                    <span className="text-xs text-slate-400 select-none">
                      Remember my work email on this device
                    </span>
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2.5,
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338ca 0%, #2563eb 100%)',
                  boxShadow: '0 6px 20px 0 rgba(79, 70, 229, 0.5)',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
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
                  <span>Sign in to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-medium tracking-wider">
                  New Organization?
                </span>
              </div>
            </div>

            {/* Register Organization CTA */}
            <div className="text-center">
              <Link
                component={RouterLink}
                to={ROUTES.AUTH.REGISTER}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  width: '100%',
                  py: 1.25,
                  px: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(51, 65, 85, 0.8)',
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(51, 65, 85, 0.8)',
                    borderColor: '#6366f1',
                    color: '#ffffff',
                  },
                }}
              >
                <span>Register new organization workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              </Link>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-500">
            Protected by enterprise SSL encryption and role-based policies.
          </div>
        </motion.div>
      </div>
    </div>
  );
};

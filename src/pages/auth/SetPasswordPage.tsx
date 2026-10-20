import React, { useState } from 'react';
import { useSetPassword } from '../../hooks/useSetPassword';
import { AuthLayout } from '../../components/layout/AuthLayout';
import {
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Alert,
  Box,
  LinearProgress,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Lock, ArrowRight, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

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

export const SetPasswordPage: React.FC = () => {
  const {
    formState,
    setField,
    submit,
    loading,
    error,
    token,
    tokenInfo,
    terminateOtherSessions,
    setTerminateOtherSessions,
  } = useSetPassword();
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = getPasswordStrength(formState.password);

  return (
    <AuthLayout
      title="Set Your Password"
      subtitle={
        tokenInfo?.email
          ? `Create a secure password for ${tokenInfo.email}`
          : 'Welcome! Create your password to get started.'
      }
      maxWidth={440}
    >
      {!token ? (
        <Alert
          severity="error"
          icon={<AlertCircle size={22} />}
          sx={{
            alignItems: 'center',
            py: 2,
            borderRadius: 2,
            bgcolor: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            '& .MuiAlert-icon': { color: '#ef4444' },
          }}
        >
          Invalid or missing invitation link.
        </Alert>
      ) : (
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                New Password
              </label>
              <TextField
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
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

          {/* Option to terminate other sessions */}
          <Box
            sx={{
              mb: 3.5,
              p: 2,
              borderRadius: 2,
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={terminateOtherSessions}
                  onChange={(e) => setTerminateOtherSessions(e.target.checked)}
                  size="small"
                  sx={{
                    color: '#94a3b8',
                    '&.Mui-checked': {
                      color: '#4f46e5',
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontSize: '0.825rem' }}>
                    Terminate all other logged in sessions
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                    Sign out of all other browsers, computers, and mobile devices immediately.
                  </Typography>
                </Box>
              }
            />

            {tokenInfo?.hasOtherSessions && (tokenInfo.activeSessionCount ?? 0) > 0 && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: '#fffbeb',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#b45309',
                  fontSize: '0.75rem',
                }}
              >
                <ShieldAlert size={16} className="text-amber-500 shrink-0" />
                <span>
                  Notice: You currently have {tokenInfo.activeSessionCount} active session(s) that will be terminated.
                </span>
              </Box>
            )}
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
                <span>Setting password...</span>
              </Box>
            ) : (
              'Set Password'
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};
export default SetPasswordPage;

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
    >
      {!token ? (
        <Alert severity="error" icon={<AlertCircle size={24} />} sx={{ alignItems: 'center', py: 2 }}>
          Invalid or missing invitation link.
        </Alert>
      ) : (
        <form onSubmit={submit} noValidate>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} role="alert">
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
            <Box>
              <TextField
                id="password"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
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
                  },
                }}
              />
              {formState.password && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength}
                    color={getStrengthColor(passwordStrength)}
                    sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {passwordStrength <= 25 && 'Weak'}
                    {passwordStrength > 25 && passwordStrength <= 50 && 'Fair'}
                    {passwordStrength > 50 && passwordStrength <= 75 && 'Good'}
                    {passwordStrength > 75 && 'Strong'}
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField
              id="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              fullWidth
              value={formState.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {/* Option to terminate other sessions */}
          <Box
            sx={{
              mb: 4,
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(51, 65, 85, 0.7)',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={terminateOtherSessions}
                  onChange={(e) => setTerminateOtherSessions(e.target.checked)}
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
                <Box>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.825rem' }}>
                    Terminate all other logged in sessions
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.25 }}>
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
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#fcd34d',
                  fontSize: '0.75rem',
                }}
              >
                <ShieldAlert size={16} className="text-amber-400 shrink-0" />
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
            endIcon={loading ? undefined : <ArrowRight size={20} />}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Loader2 className="animate-spin" size={20} />
                Setting password...
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

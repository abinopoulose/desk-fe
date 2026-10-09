import React, { useState } from 'react';
import { useSetPassword } from '../../hooks/useSetPassword';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { TextField, InputAdornment, IconButton, Button, Alert, Box, LinearProgress, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

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
  const { formState, setField, submit, loading, error, token } = useSetPassword();
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = getPasswordStrength(formState.password);

  return (
    <AuthLayout title="Set Your Password" subtitle="Welcome! Create your password to get started.">
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
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
                    startAdornment: <InputAdornment position="start"><Lock size={20} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
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
                  startAdornment: <InputAdornment position="start"><Lock size={20} /></InputAdornment>,
                }
              }}
            />
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

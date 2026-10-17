import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { TextField, InputAdornment, Button, Alert, Box, Link } from '@mui/material';
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { requestForgotPassword } from '../../api/sessionApi';
import { ROUTES } from '../../constants';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setLoading(true);

    try {
      await requestForgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const errorObj = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      setError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={
        submitted
          ? 'Check your inbox for reset instructions'
          : "Enter your account's verified email address to receive a secure password reset link."
      }
    >
      {submitted ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle2 size={32} className="text-emerald-400" />
          </Box>

          <Alert
            severity="success"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#6ee7b7',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              width: '100%',
              textAlign: 'left',
            }}
          >
            If an account is associated with <strong>{email}</strong>, a password reset link has been dispatched.
          </Alert>

          <Button
            component={RouterLink}
            to={ROUTES.AUTH.LOGIN}
            variant="contained"
            fullWidth
            startIcon={<ArrowLeft size={18} />}
            sx={{
              py: 1.5,
              borderRadius: 2.5,
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            }}
          >
            Return to Sign In
          </Button>
        </Box>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
              role="alert"
            >
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 4 }}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !email}
            sx={{
              py: 1.5,
              borderRadius: 2.5,
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338ca 0%, #2563eb 100%)',
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Sending Reset Link...</span>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </Box>
            )}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link
              component={RouterLink}
              to={ROUTES.AUTH.LOGIN}
              variant="caption"
              sx={{
                color: '#818cf8',
                textDecoration: 'none',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </Box>
        </form>
      )}
    </AuthLayout>
  );
};

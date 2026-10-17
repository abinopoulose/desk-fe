import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { setPassword } from '../api/authApi';
import { getResetTokenInfo } from '../api/sessionApi';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '../constants';
import type { ResetTokenInfo } from '../types/session';

export const useSetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<ResetTokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [terminateOtherSessions, setTerminateOtherSessions] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const login = useAuthStore((state) => state.login);

  const [formState, setFormState] = useState({
    password: '',
    confirmPassword: '',
  });

  const setField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    setValidatingToken(true);
    getResetTokenInfo(token)
      .then((info) => {
        if (isMounted) {
          setTokenInfo(info);
          if (!info.valid) {
            setError('This invitation or password reset link is invalid or has expired.');
          }
        }
      })
      .catch(() => {
        // Fallback gracefully if inspection fails
      })
      .finally(() => {
        if (isMounted) setValidatingToken(false);
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing invitation link.');
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await setPassword({
        token,
        password: formState.password,
        confirmPassword: formState.confirmPassword,
        terminateOtherSessions,
      });
      login(response.token, response.user);
      navigate(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const errorObj = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      const message = errorObj?.response?.data?.message || errorObj?.message || '';

      if (message.includes('expired')) {
        setError('This invitation link has expired. Please contact your administrator.');
      } else if (message.includes('used')) {
        setError('This invitation link has already been used.');
      } else if (message.includes('Invalid') || message.includes('invalid')) {
        setError('Invalid invitation link.');
      } else if (message) {
        setError(message);
      } else {
        setError('Failed to set password');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    formState,
    setField,
    submit,
    loading,
    error,
    token,
    tokenInfo,
    validatingToken,
    terminateOtherSessions,
    setTerminateOtherSessions,
  };
};

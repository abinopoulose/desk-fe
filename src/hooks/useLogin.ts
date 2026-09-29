import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { AxiosError } from 'axios';
import { login as loginApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { ROUTES, VALIDATION_MESSAGES } from '../constants';

export interface LoginFormState {
  email: string;
  password: string;
}

export function useLogin() {
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const loginAction = useAuthStore((state) => state.login);

  const setField = useCallback((field: keyof LoginFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      setError(null);

      if (!formState.email || !formState.password) {
        setError(VALIDATION_MESSAGES.ALL_FIELDS_REQUIRED);
        return false;
      }

      setLoading(true);
      try {
        const response = await loginApi({
          email: formState.email,
          password: formState.password,
        });
        loginAction(response.token, response.user, response.user.roles || []);

        const state = location.state as { from?: { pathname: string } } | null;
        const from = state?.from?.pathname || ROUTES.DASHBOARD;
        navigate(from, { replace: true });
        return true;
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.response?.status === 401) {
            setError('Invalid credentials');
          } else if (err.response?.status === 403) {
            setError('Unauthorized domain');
          } else {
            setError(err.response?.data?.message || 'A network error occurred. Please try again.');
          }
        } else {
          setError('An unexpected error occurred');
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [formState, location.state, loginAction, navigate]
  );

  return {
    formState,
    setField,
    submit,
    loading,
    error,
  };
}

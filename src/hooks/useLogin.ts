import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
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
        loginAction(response.token, response.user, response.privileges || []);

        const state = location.state as { from?: { pathname: string } } | null;
        const from = state?.from?.pathname || ROUTES.DASHBOARD;
        navigate(from, { replace: true });
        return true;
      } catch (err: unknown) {
        const errorObj = err as {
          message?: string;
          statusCode?: number;
          response?: { status?: number; data?: { message?: string } };
        };
        const status = errorObj?.statusCode || errorObj?.response?.status;
        const serverMessage = errorObj?.response?.data?.message || errorObj?.message;

        if (status === 401) {
          setError(serverMessage || 'Invalid email or password');
        } else if (status === 403) {
          setError(serverMessage || 'Unauthorized domain');
        } else if (serverMessage) {
          setError(serverMessage);
        } else {
          setError('A network error occurred. Please try again.');
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

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { register as registerApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { ROUTES, APP_CONFIG, VALIDATION_MESSAGES } from '../constants';
import { matchesField, password as passwordValidator } from '../utils/validation';

export interface RegisterFormState {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

export function useRegister() {
  const [formState, setFormState] = useState<RegisterFormState>({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);

  const setField = useCallback((field: keyof RegisterFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      setError(null);

      const { email, fullName, password, confirmPassword } = formState;

      if (!email || !fullName || !password || !confirmPassword) {
        setError(VALIDATION_MESSAGES.ALL_FIELDS_REQUIRED);
        return false;
      }

      const matchError = matchesField(password)(confirmPassword);
      if (matchError) {
        setError(matchError);
        return false;
      }

      const passwordError = passwordValidator({ minLength: APP_CONFIG.AUTH.MIN_PASSWORD_LENGTH })(password);
      if (passwordError) {
        setError(passwordError);
        return false;
      }

      setLoading(true);
      try {
        const response = await registerApi({ email, fullName, password });

        if (response && response.token) {
          loginAction(response.token, response.user, response.user.roles || []);
          navigate(ROUTES.DASHBOARD, { replace: true });
        } else {
          navigate(ROUTES.AUTH.LOGIN, {
            state: { message: 'Registration successful. Please log in.' },
          });
        }
        return true;
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.response?.status === 403) {
            setError('Email domain not allowed. Please use your organization email.');
          } else if (err.response?.status === 409) {
            setError('Email already registered.');
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
    [formState, loginAction, navigate]
  );

  return {
    formState,
    setField,
    submit,
    loading,
    error,
  };
}

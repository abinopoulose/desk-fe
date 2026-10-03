import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { setPassword } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '../constants';

export const useSetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const response = await setPassword({ token, password: formState.password, confirmPassword: formState.confirmPassword });
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

  return { formState, setField, submit, loading, error, token };
};

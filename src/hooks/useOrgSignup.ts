import { useState } from 'react';
import { useNavigate } from 'react-router';
import { registerOrganization } from '../api/organizationApi';
import { useAuthStore } from '../store/authStore';
import type { CreateOrgRequest } from '../types/auth';
import { ROUTES } from '../constants';

export const useOrgSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formState, setFormState] = useState({
    name: '',
    adminFullName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
  });

  const setField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formState.password !== formState.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateOrgRequest = {
        name: formState.name,
        adminFullName: formState.adminFullName,
        adminEmail: formState.adminEmail,
        password: formState.password,
      };
      const response = await registerOrganization(payload);
      login(response.data.token, response.data.user);
      navigate(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const errorObj = err as {
        statusCode?: number;
        message?: string;
        response?: { status?: number; data?: { message?: string } };
      };
      const status = errorObj?.statusCode || errorObj?.response?.status;
      const serverMessage = errorObj?.response?.data?.message || errorObj?.message;

      if (status === 403) {
        setError('This email domain is not authorized to register.');
      } else if (status === 409) {
        setError('An organization already exists for this domain.');
      } else if (serverMessage) {
        setError(serverMessage);
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return { formState, setField, submit, loading, error };
};

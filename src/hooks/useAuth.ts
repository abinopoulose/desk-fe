import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { login as loginApi } from '../api/authApi';
import type { LoginRequest, UserDTO } from '../types/auth';
import type { ApiError } from '../utils/apiErrorHandler';

export interface AuthData {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  privileges: string[];
}

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const privileges = useAuthStore((state) => state.privileges);
  const storeLogin = useAuthStore((state) => state.login);
  const storeLogout = useAuthStore((state) => state.logout);
  const storeInitialize = useAuthStore((state) => state.initialize);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (request: LoginRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await loginApi(request);
        storeLogin(response.token, response.user, response.user.roles || []);
        return response;
      } catch (err: unknown) {
        const message = (err as ApiError)?.message || 'Login failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [storeLogin]
  );


  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  const initialize = useCallback(() => {
    storeInitialize();
  }, [storeInitialize]);

  const hasPrivilege = useCallback(
    (privilege: string) => {
      const isSuperAdmin = Boolean(
        user?.roles?.includes('SUPER_ADMIN') ||
        user?.roles?.includes('ORG_ADMIN') ||
        privileges.includes('SUPER_ADMIN') ||
        privileges.includes('ORG_ADMIN') ||
        privileges.includes('ADMIN_FULL_ACCESS')
      );
      return isSuperAdmin || privileges.includes(privilege);
    },
    [privileges, user]
  );

  return {
    data: {
      user,
      token,
      isAuthenticated,
      privileges,
    },
    loading,
    error,
    login,
    logout,
    initialize,
    hasPrivilege,
  };
}

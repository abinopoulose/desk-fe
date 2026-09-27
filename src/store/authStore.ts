import { create } from 'zustand';
import type { UserDTO } from '../types/auth';

export interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  privileges: string[];
  login: (token: string, user: UserDTO, privileges?: string[]) => void;
  logout: () => void;
  initialize: () => void;
}

const isTokenValid = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  privileges: [],
  login: (token, user, privileges = []) => {
    localStorage.setItem('desk_token', token);
    localStorage.setItem('desk_user', JSON.stringify(user));
    localStorage.setItem('desk_privileges', JSON.stringify(privileges));
    set({ user, token, isAuthenticated: true, privileges });
  },
  logout: () => {
    localStorage.removeItem('desk_token');
    localStorage.removeItem('desk_user');
    localStorage.removeItem('desk_privileges');
    set({ user: null, token: null, isAuthenticated: false, privileges: [] });
    // redirect to login
    window.location.href = '/login';
  },
  initialize: () => {
    const token = localStorage.getItem('desk_token');
    if (token) {
      if (isTokenValid(token)) {
        let user = null;
        let privileges: string[] = [];
        try {
          const userStr = localStorage.getItem('desk_user');
          if (userStr) user = JSON.parse(userStr);
          const privStr = localStorage.getItem('desk_privileges');
          if (privStr) privileges = JSON.parse(privStr);
        } catch {
          // ignore parsing errors
        }
        set({ token, user, isAuthenticated: true, privileges });
      } else {
        localStorage.removeItem('desk_token');
        localStorage.removeItem('desk_user');
        localStorage.removeItem('desk_privileges');
        set({ user: null, token: null, isAuthenticated: false, privileges: [] });
      }
    }
  }
}));

export const useAuth = () => {
  const privileges = useAuthStore((state) => state.privileges);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return {
    hasPrivilege: (p: string) => privileges.includes(p),
    user,
    isAuthenticated
  };
};

import type { UserDTO } from '../types/auth';

const TOKEN_KEY = 'desk_token';
const USER_KEY = 'desk_user';
const PRIVILEGES_KEY = 'desk_privileges';

export const tokenStorage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
  getUser: (): UserDTO | null => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: UserDTO): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getPrivileges: (): string[] | null => {
    try {
      const privStr = localStorage.getItem(PRIVILEGES_KEY);
      return privStr ? JSON.parse(privStr) : null;
    } catch {
      return null;
    }
  },
  setPrivileges: (privileges: string[]): void => {
    localStorage.setItem(PRIVILEGES_KEY, JSON.stringify(privileges));
  },
  clearAll: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PRIVILEGES_KEY);
  }
};

import { ROUTES } from '../constants';
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

export const DEFAULT_ROLE_PRIVILEGES: Record<string, string[]> = {
  SUPER_ADMIN: [
    'USER_READ', 'USER_WRITE', 'USER_DELETE',
    'ROLE_READ', 'ROLE_WRITE',
    'TICKET_READ', 'TICKET_WRITE', 'TICKET_DELETE', 'TICKET_MANAGEMENT',
    'TICKET_TYPE_READ', 'TICKET_TYPE_WRITE', 'TICKET_TYPE_DELETE',
    'DEPARTMENT_READ', 'DEPARTMENT_WRITE', 'DEPARTMENT_DELETE',
    'FOLDER_READ', 'FOLDER_WRITE', 'FOLDER_DELETE',
    'SLA_READ', 'SLA_WRITE',
    'METRICS_READ',
    'AUDIT_READ',
    'ADMIN_FULL_ACCESS',
    'TENANT_MANAGE'
  ],
  IT_SUPPORT: [
    'USER_READ', 'TICKET_READ', 'TICKET_WRITE', 'TICKET_MANAGEMENT',
    'TICKET_TYPE_READ', 'DEPARTMENT_READ', 'FOLDER_READ', 'SLA_READ'
  ],
  MANAGER: [
    'USER_READ', 'TICKET_READ', 'TICKET_TYPE_READ',
    'DEPARTMENT_READ', 'FOLDER_READ', 'SLA_READ', 'METRICS_READ'
  ],
  EMPLOYEE: [
    'USER_READ', 'TICKET_READ', 'TICKET_WRITE',
    'TICKET_TYPE_READ', 'FOLDER_READ'
  ]
};

export function resolvePrivileges(roles: string[] = [], explicitPrivileges: string[] = []): string[] {
  if (explicitPrivileges.length > 0) {
    const privs = new Set<string>(explicitPrivileges);
    for (const p of explicitPrivileges) {
      const rolePrivs = DEFAULT_ROLE_PRIVILEGES[p];
      if (rolePrivs) {
        rolePrivs.forEach((rp) => privs.add(rp));
      }
    }
    return Array.from(privs);
  }

  const privs = new Set<string>(roles);
  for (const role of roles) {
    const rolePrivs = DEFAULT_ROLE_PRIVILEGES[role];
    if (rolePrivs) {
      rolePrivs.forEach((p) => privs.add(p));
    }
  }
  return Array.from(privs);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  privileges: [],
  login: (token, user, privileges = []) => {
    const resolvedPrivileges = resolvePrivileges(user?.roles || [], privileges);
    localStorage.setItem('desk_token', token);
    localStorage.setItem('desk_user', JSON.stringify(user));
    localStorage.setItem('desk_privileges', JSON.stringify(resolvedPrivileges));
    set({ user, token, isAuthenticated: true, privileges: resolvedPrivileges });
  },
  logout: () => {
    localStorage.removeItem('desk_token');
    localStorage.removeItem('desk_user');
    localStorage.removeItem('desk_privileges');
    set({ user: null, token: null, isAuthenticated: false, privileges: [] });
    // redirect to login
    window.location.href = ROUTES.AUTH.LOGIN;
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
        if (user && privileges.length === 0) {
          privileges = resolvePrivileges(user.roles || [], []);
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
  const isSuperAdmin = Boolean(
    user?.roles?.includes('SUPER_ADMIN') ||
    privileges.includes('SUPER_ADMIN') ||
    privileges.includes('ADMIN_FULL_ACCESS')
  );
  return {
    hasPrivilege: (p: string) => isSuperAdmin || privileges.includes(p),
    user,
    isAuthenticated
  };
};

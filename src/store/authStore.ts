import { ROUTES } from '../constants';
import { create } from 'zustand';
import type { UserDTO } from '../types/auth';
import { tokenStorage } from '../utils/tokenStorage';
import { getCurrentUser } from '../api/authApi';

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
  ORG_ADMIN: [
    'ADMIN_FULL_ACCESS', 'TENANT_MANAGE', 'METRICS_READ', 'AUDIT_READ',
    'USER_READ', 'USER_WRITE', 'USER_DELETE', 'USER_INVITE',
    'ROLE_READ', 'ROLE_WRITE',
    'TICKET_READ', 'TICKET_WRITE', 'TICKET_DELETE', 'TICKET_MANAGEMENT',
    'TICKET_TYPE_READ', 'TICKET_TYPE_WRITE', 'TICKET_TYPE_DELETE',
    'DEPARTMENT_READ', 'DEPARTMENT_WRITE', 'DEPARTMENT_DELETE',
    'FOLDER_READ', 'FOLDER_WRITE', 'FOLDER_DELETE',
    'SLA_READ', 'SLA_WRITE',
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
    'TICKET_TYPE_READ', 'FOLDER_READ', 'DEPARTMENT_READ'
  ],
  USER: [
    'USER_READ', 'TICKET_READ', 'TICKET_WRITE',
    'TICKET_TYPE_READ', 'FOLDER_READ', 'DEPARTMENT_READ'
  ]
};

export function resolvePrivileges(roles: string[] = [], explicitPrivileges: string[] = []): string[] {
  if (explicitPrivileges && explicitPrivileges.length > 0) {
    const privs = new Set<string>(explicitPrivileges);
    return Array.from(privs);
  }

  const privs = new Set<string>();
  for (const role of roles) {
    const roleUpper = role.toUpperCase();
    const rolePrivs = DEFAULT_ROLE_PRIVILEGES[roleUpper];
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
    tokenStorage.setToken(token);
    tokenStorage.setUser(user);
    tokenStorage.setPrivileges(resolvedPrivileges);
    set({ user, token, isAuthenticated: true, privileges: resolvedPrivileges });
  },
  logout: () => {
    tokenStorage.clearAll();
    set({ user: null, token: null, isAuthenticated: false, privileges: [] });
    // redirect to login if not already on the login page
    if (typeof window !== 'undefined' && window.location.pathname !== ROUTES.AUTH.LOGIN) {
      window.location.href = ROUTES.AUTH.LOGIN;
    }
  },
  initialize: () => {
    const token = tokenStorage.getToken();
    if (token) {
      if (isTokenValid(token)) {
        const user = tokenStorage.getUser();
        let privileges = tokenStorage.getPrivileges() || [];
        
        if (user && privileges.length === 0) {
          privileges = resolvePrivileges(user.roles || [], []);
        }
        set({ token, user, isAuthenticated: true, privileges });

        // Background sync user & authoritative privileges with backend
        getCurrentUser().then((res) => {
          if (res.user) {
            const freshPrivs = res.privileges && res.privileges.length > 0
              ? res.privileges
              : resolvePrivileges(res.user.roles || [], []);
            tokenStorage.setUser(res.user);
            tokenStorage.setPrivileges(freshPrivs);
            set({ user: res.user, privileges: freshPrivs });
          }
        }).catch(() => {
          // Keep existing credentials if network fails
        });
      } else {
        tokenStorage.clearAll();
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
    user?.roles?.includes('ORG_ADMIN') ||
    privileges.includes('SUPER_ADMIN') ||
    privileges.includes('ORG_ADMIN') ||
    privileges.includes('ADMIN_FULL_ACCESS')
  );
  return {
    hasPrivilege: (p: string) => isSuperAdmin || privileges.includes(p),
    user,
    isAuthenticated,
    isSuperAdmin
  };
};
useAuthStore.getState().initialize();

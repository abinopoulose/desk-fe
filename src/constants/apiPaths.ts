export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    SET_PASSWORD: '/api/v1/auth/set-password',
    ME: '/api/v1/auth/me',
  },
  ORGANIZATIONS: {
    REGISTER: '/api/v1/organizations/register',
    RESOLVE: (subdomain: string) => `/api/v1/organizations/resolve/${subdomain}`,
  },
  TICKETS: {
    BASE: '/api/v1/tickets',
    BY_ID: (id: string) => `/api/v1/tickets/${id}`,
    SCHEMA: (typeId: string) => `/api/v1/ticket-types/${typeId}/schema`,
    STATUS: (id: string) => `/api/v1/tickets/${id}/status`,
    ASSIGN: (id: string) => `/api/v1/tickets/${id}/assignee`,
    COMMENTS: (id: string) => `/api/v1/tickets/${id}/comments`,
    ACCESS: (id: string) => `/api/v1/tickets/${id}/access`,
    SHARES: (id: string) => `/api/v1/tickets/${id}/shares`,
  },
  DEPARTMENTS: {
    BASE: '/api/v1/departments',
    BY_ID: (id: string) => `/api/v1/departments/${id}`,
    MY: '/api/v1/departments/my',
    MEMBERS: (id: string) => `/api/v1/departments/${id}/members`,
    MEMBER_ROLE: (id: string, userId: string) => `/api/v1/departments/${id}/members/${userId}`,
    METRICS: (id: string) => `/api/v1/departments/${id}/metrics`,
  },
  TICKET_TYPES: {
    BASE: '/api/v1/ticket-types',
    BY_ID: (id: string) => `/api/v1/ticket-types/${id}`,
    SLA_CONFIGS: (id: string) => `/api/v1/ticket-types/${id}/sla-configs`,
    STATUSES: (id: string) => `/api/v1/ticket-types/${id}/statuses`,
  },
  TICKET_STATUSES: {
    BY_ID: (id: string) => `/api/v1/ticket-statuses/${id}`,
  },
  METRICS: {
    BASE: '/api/v1/metrics',
    PERFORMANCE: '/api/v1/metrics/performance',
  },
  ROLES: {
    BASE: '/api/v1/roles',
    BY_NAME: (name: string) => `/api/v1/roles/${name}`,
  },
  SLA_CONFIGS: {
    BY_ID: (id: string) => `/api/v1/sla-configs/${id}`,
  },
  SLA: {
    BASE: '/api/v1/slas',
  },
  USERS: {
    BASE: '/api/v1/users',
    ROLES: (id: string) => `/api/v1/users/${id}/roles`,
    PROFILE: (id: string) => `/api/v1/users/${id}/profile`,
    HIERARCHY: '/api/v1/users/hierarchy',
    INVITE: '/api/v1/users/invite',
    RESEND_INVITE: (id: string) => `/api/v1/users/${id}/resend-invitation`,
  },
  FOLDERS: {
    BASE: '/api/v1/folders',
    TREE: '/api/v1/folders/tree',
    CONTENTS: (id: string) => `/api/v1/folders/${id}/contents`,
  }
} as const;

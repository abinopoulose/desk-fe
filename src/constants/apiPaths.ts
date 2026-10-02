export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    SET_PASSWORD: '/api/v1/auth/set-password',
  },
  ORGANIZATIONS: {
    REGISTER: '/api/v1/organizations/register',
  },
  TICKETS: {
    BASE: '/api/v1/tickets',
    BY_ID: (id: string) => `/api/v1/tickets/${id}`,
    SCHEMA: (typeId: string) => `/api/v1/ticket-types/${typeId}/schema`,
    STATUS: (id: string) => `/api/v1/tickets/${id}/status`,
    ASSIGN: (id: string) => `/api/v1/tickets/${id}/assign`,
    COMMENTS: (id: string) => `/api/v1/tickets/${id}/comments`,
  },
  DEPARTMENTS: {
    BASE: '/api/v1/departments',
    BY_ID: (id: string) => `/api/v1/departments/${id}`,
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

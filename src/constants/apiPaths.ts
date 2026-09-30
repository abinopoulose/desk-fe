export const API_PATHS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  TICKETS: {
    BASE: '/tickets',
    BY_ID: (id: string) => `/tickets/${id}`,
    SCHEMA: (typeId: string) => `/ticket-types/${typeId}/schema`,
    STATUS: (id: string) => `/tickets/${id}/status`,
    ASSIGN: (id: string) => `/tickets/${id}/assign`,
    COMMENTS: (id: string) => `/tickets/${id}/comments`,
  },
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id: string) => `/departments/${id}`,
  },
  TICKET_TYPES: {
    BASE: '/ticket-types',
    BY_ID: (id: string) => `/ticket-types/${id}`,
    SLA_CONFIGS: (id: string) => `/ticket-types/${id}/sla-configs`,
    STATUSES: (id: string) => `/ticket-types/${id}/statuses`,
  },
  TICKET_STATUSES: {
    BY_ID: (id: string) => `/ticket-statuses/${id}`,
  },
  METRICS: {
    BASE: '/metrics',
    PERFORMANCE: '/metrics/performance',
  },
  ROLES: {
    BASE: '/roles',
    BY_NAME: (name: string) => `/roles/${name}`,
  },
  SLA_CONFIGS: {
    BY_ID: (id: string) => `/sla-configs/${id}`,
  },
  SLA: {
    BASE: '/slas',
  },
  TENANT: {
    BASE: '/tenant',
    CONFIG: '/tenant/config',
  },
  USERS: {
    BASE: '/users',
    ROLES: (id: string) => `/users/${id}/roles`,
    PROFILE: (id: string) => `/users/${id}/profile`,
    HIERARCHY: '/users/hierarchy',
  },
  FOLDERS: {
    BASE: '/folders',
    TREE: '/folders/tree',
    CONTENTS: (id: string) => `/folders/${id}/contents`,
  }
} as const;

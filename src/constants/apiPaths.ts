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
  },
  METRICS: {
    BASE: '/metrics',
  },
  ROLES: {
    BASE: '/roles',
  },
  SLA: {
    BASE: '/slas',
  },
  TENANT: {
    BASE: '/tenant',
  },
  USERS: {
    BASE: '/users',
  },
  FOLDERS: {
    BASE: '/folders',
  }
} as const;

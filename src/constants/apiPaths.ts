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
    STATUSES: (typeId: string) => `/ticket-types/${typeId}/statuses`,
    SLA_CONFIGS: (typeId: string) => `/ticket-types/${typeId}/sla-configs`,
  },
  TICKET_STATUSES: {
    BY_ID: (statusId: string) => `/ticket-statuses/${statusId}`,
  },
  SLA_CONFIGS: {
    BY_ID: (id: string) => `/sla-configs/${id}`,
  },
  METRICS: {
    BASE: '/metrics',
    PERFORMANCE: '/metrics/performance',
  },
  ROLES: {
    BASE: '/roles',
    BY_NAME: (roleName: string) => `/roles/${roleName}`,
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
    ROLES: (userId: string) => `/users/${userId}/roles`,
    PROFILE: (userId: string) => `/users/${userId}/profile`,
    HIERARCHY: '/users/hierarchy',
  },
  FOLDERS: {
    BASE: '/folders',
    TREE: '/folders/tree',
    CONTENTS: (folderId: string) => `/folders/${folderId}/contents`,
  }
} as const;

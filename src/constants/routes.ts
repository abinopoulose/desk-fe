export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
  },
  DASHBOARD: '/dashboard',
  BROWSE: '/browse',
  TICKETS: {
    BASE: '/tickets',
    NEW: '/tickets/new',
    DETAILS: (id: string) => `/tickets/${id}`,
  },
  ADMIN: {
    TICKET_TYPES: '/admin/ticket-types',
    TICKET_TYPE_NEW: '/admin/ticket-types/new',
    TICKET_TYPE_EDIT: (id: string) => `/admin/ticket-types/${id}/edit`,
    TICKET_STATUSES: (id: string) => `/admin/ticket-types/${id}/statuses`,
    SLA_CONFIGS: '/admin/sla-configs',
    DEPARTMENTS: '/admin/departments',
    ROLES: '/admin/roles',
    TENANT: '/admin/tenant',
  },
} as const;

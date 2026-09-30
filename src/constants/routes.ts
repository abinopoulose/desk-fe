export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
  },
  DASHBOARD: '/dashboard',
  BROWSE: '/browse',
  ORG_CHART: '/org-chart',
  METRICS: '/metrics',
  USERS: {
    PROFILE_PATH: '/users/:userId',
    PROFILE: (id: string | number) => `/users/${id}`,
  },
  TICKETS: {
    BASE: '/tickets',
    NEW: '/tickets/new',
    DETAILS_PATH: '/tickets/:ticketId',
    DETAILS: (id: string | number) => `/tickets/${id}`,
  },
  ADMIN: {
    TICKET_TYPES: '/admin/ticket-types',
    TICKET_TYPE_NEW: '/admin/ticket-types/new',
    TICKET_TYPE_EDIT_PATH: '/admin/ticket-types/:id/edit',
    TICKET_TYPE_EDIT: (id: string | number) => `/admin/ticket-types/${id}/edit`,
    TICKET_STATUSES_PATH: '/admin/ticket-types/:id/statuses',
    TICKET_STATUSES: (id: string | number) => `/admin/ticket-types/${id}/statuses`,
    SLA_CONFIGS: '/admin/sla-configs',
    DEPARTMENTS: '/admin/departments',
    ROLES: '/admin/roles',
    TENANT: '/admin/tenant',
  },
} as const;

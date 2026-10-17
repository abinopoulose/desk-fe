export const AVAILABLE_PERMISSIONS = [
  'USER_EDIT',
  'TICKET_TYPE_EDIT',
  'DEPARTMENT_EDIT',
  'ROLE_EDIT',
] as const;

export const AVAILABLE_PRIVILEGES = AVAILABLE_PERMISSIONS;

export const PERMISSION_LABELS: Record<string, string> = {
  USER_EDIT: 'User Edit (edit user details, manager, invite user, etc.)',
  TICKET_TYPE_EDIT: 'Ticket Types & Master (create/edit ticket types, SLA, folders)',
  DEPARTMENT_EDIT: 'Department Edit (create and edit department name, alpha tags, etc.)',
  ROLE_EDIT: 'Roles & Permissions (edit roles & permissions of a user)',
  ADMIN_FULL_ACCESS: 'Admin Full Access',
};

export const DEFAULT_ROLE_VALUES = {
  name: '',
  description: '',
  permissions: [] as string[],
};

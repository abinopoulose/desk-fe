/**
 * Detects whether a string looks like a UUID or raw hex/opaque database identifier.
 */
export function isUuidLike(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  // Standard hyphenated UUID: 8-4-4-4-12
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return true;
  }
  // 32-hex character unhyphenated UUID
  if (/^[0-9a-f]{32}$/i.test(trimmed)) {
    return true;
  }
  // 24-hex character MongoDB/ObjectID
  if (/^[0-9a-f]{24}$/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Known human-readable labels for standard URL segments.
 */
const ROUTE_SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  'ticket-types': 'Ticket Types',
  'department-tickets': 'Department Tickets',
  'sla-configs': 'SLA Configurations',
  'org-chart': 'Organization Chart',
  departments: 'Departments',
  tickets: 'Tickets',
  users: 'Users',
  members: 'Members',
  metrics: 'Metrics',
  statuses: 'Statuses',
  edit: 'Edit',
  new: 'New',
  roles: 'Roles',
  employees: 'Employees',
  dashboard: 'Dashboard',
  settings: 'Settings',
  browse: 'Service Catalog',
};

/**
 * Formats a generic non-UUID path segment into title case.
 */
export function formatRouteSegment(segment: string): string {
  if (!segment) return '';
  const lower = segment.toLowerCase();
  if (ROUTE_SEGMENT_LABELS[lower]) {
    return ROUTE_SEGMENT_LABELS[lower];
  }
  return segment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Determines a human-readable fallback when an ID / UUID is encountered
 * and hasn't yet resolved to its human-readable entity title in the store.
 */
export function getFallbackSegmentLabel(_segment: string, prevSegment?: string): string {
  const prevLower = prevSegment?.toLowerCase();
  if (prevLower === 'departments') return 'Department';
  if (prevLower === 'tickets') return 'Ticket';
  if (prevLower === 'ticket-types') return 'Ticket Type';
  if (prevLower === 'users') return 'User Profile';
  return 'Details';
}

/**
 * Determines the target SPA navigation URL when clicking an intermediate breadcrumb.
 */
export function getBreadcrumbHref(paths: string[], index: number): string {
  const currentSegment = paths[index];
  const prevSegment = index > 0 ? paths[index - 1] : undefined;

  // Clicking a department ID: go to that department's tickets page
  if (prevSegment === 'departments') {
    return `/departments/${currentSegment}/tickets`;
  }

  // Clicking a ticket type ID: go to edit page
  if (prevSegment === 'ticket-types') {
    return `/admin/ticket-types/${currentSegment}/edit`;
  }

  // Segment 0: special cases
  if (index === 0) {
    if (currentSegment === 'tickets') return '/dashboard';
    if (currentSegment === 'users') return '/admin/employees';
    if (currentSegment === 'admin') return '/admin/ticket-types';
  }

  return `/${paths.slice(0, index + 1).join('/')}`;
}

/**
 * Resolves a clean, user-friendly page heading for the top navigation bar.
 */
export function getPageTitle(
  pathname: string,
  user?: { id?: string; email?: string; fullName?: string } | null
): string {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '/dashboard') return 'Dashboard';
  if (cleanPath === '/org-chart') return 'Organization Chart';
  if (cleanPath === '/department-tickets') return 'Department Tickets';
  if (cleanPath === '/browse') return 'Service Catalog';
  if (cleanPath === '/tickets/new') return 'Create Request';
  if (cleanPath.startsWith('/tickets/')) return 'Ticket Details';

  if (cleanPath.startsWith('/departments/')) {
    if (cleanPath.endsWith('/members')) return 'Department Members';
    if (cleanPath.endsWith('/metrics')) return 'Department Metrics';
    return 'Department Tickets';
  }
  if (cleanPath === '/departments') return 'Departments';

  if (cleanPath === '/admin/ticket-types') return 'Ticket Types';
  if (cleanPath === '/admin/ticket-types/new') return 'Create Ticket Type';
  if (cleanPath.includes('/admin/ticket-types/') && cleanPath.endsWith('/edit')) return 'Edit Ticket Type';
  if (cleanPath.includes('/admin/ticket-types/') && cleanPath.endsWith('/statuses')) return 'Ticket Statuses';
  if (cleanPath === '/admin/departments') return 'Departments';
  if (cleanPath === '/admin/roles') return 'Roles & Permissions';
  if (cleanPath === '/admin/employees') return 'Employees';

  if (cleanPath.startsWith('/users/')) {
    const segment = cleanPath.replace('/users/', '');
    if (user) {
      const userSlug = user.fullName
        ? user.fullName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        : '';
      const emailPrefix = user.email ? user.email.split('@')[0].toLowerCase() : '';
      if (segment === user.id || segment === userSlug || segment.toLowerCase() === emailPrefix) {
        return 'My Profile';
      }
    }
    return 'User Profile';
  }

  if (cleanPath === '/metrics') return 'Performance Metrics';
  if (cleanPath === '/settings') return 'Settings';

  return 'Dashboard';
}

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AppLayout } from './AppLayout';
import { useBreadcrumbStore } from '../../store/breadcrumbStore';

vi.mock('../../store/authStore', () => ({
  useAuth: () => ({
    user: { id: 'uuid-1', fullName: 'Abino', email: 'abino@abino.in', roles: ['ADMIN'] },
    hasPrivilege: () => true,
  }),
  useAuthStore: (selector: (state: { logout: () => void }) => unknown) => selector({ logout: vi.fn() }),
}));

vi.mock('../../store/appStore', () => ({
  useAppStore: () => ({
    isSidebarOpen: true,
    toggleSidebar: vi.fn(),
    setSidebarOpen: vi.fn(),
    isBackendDown: false,
  }),
}));

vi.mock('../../api/departmentApi', () => ({
  departmentApi: {
    getDepartmentById: vi.fn().mockResolvedValue({ id: 'c3cf6db0-0000-0000-0000-000000000020', name: 'HR' }),
    getMyDepartments: vi.fn().mockResolvedValue([]),
    getAllDepartments: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../api/ticketApi', () => ({
  ticketApi: {
    getTicketDetails: vi.fn().mockResolvedValue({ id: 'a0b1c2d3-0000-0000-0000-000000000001', displayId: 'TECH-2', title: 'Laptop Issue' }),
  },
}));

vi.mock('../../api/ticketTypeApi', () => ({
  ticketTypeApi: {
    getTicketTypeById: vi.fn().mockResolvedValue({ id: 'tt-uuid-1', title: 'Hardware Request' }),
  },
}));

vi.mock('../../api/userApi', () => ({
  getUserProfile: vi.fn().mockResolvedValue({ id: 'u-uuid-1', fullName: 'Abino Poulose' }),
}));

describe('AppLayout Breadcrumbs', () => {
  beforeEach(() => {
    useBreadcrumbStore.setState({ labels: {} });
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render breadcrumbs when viewing own profile (/users/abino)', () => {
    render(
      <MemoryRouter initialEntries={['/users/abino']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="users/:userId" element={<div>User Profile Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).toBeNull();
  });

  it('renders Home / Users / abino.poulose.123 for /users/abino.poulose.123', () => {
    render(
      <MemoryRouter initialEntries={['/users/abino.poulose.123']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="users/:userId" element={<div>User Profile Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(nav).getByText('Home')).toBeDefined();
    expect(within(nav).getByText('Users')).toBeDefined();
    expect(within(nav).getByText('abino.poulose.123')).toBeDefined();
  });

  it('never renders a raw UUID in department route and renders registered entity label (HR)', () => {
    const deptUuid = 'c3cf6db0-0000-0000-0000-000000000020';
    useBreadcrumbStore.getState().setLabel(deptUuid, 'HR');

    render(
      <MemoryRouter initialEntries={[`/departments/${deptUuid}/tickets`]}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="departments/:departmentId/tickets" element={<div>Department Tickets Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(nav).getByText('Home')).toBeDefined();
    expect(within(nav).getByText('Departments')).toBeDefined();
    expect(within(nav).getByText('HR')).toBeDefined();
    expect(within(nav).getByText('Tickets')).toBeDefined();
    expect(screen.queryByText(new RegExp(deptUuid, 'i'))).toBeNull();
  });

  it('never renders a raw UUID even if department entity label is not yet resolved in store', () => {
    const deptUuid = 'e4df7eb0-1111-2222-3333-444455556666';

    render(
      <MemoryRouter initialEntries={[`/departments/${deptUuid}/tickets`]}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="departments/:departmentId/tickets" element={<div>Department Tickets Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(nav).getByText('Home')).toBeDefined();
    expect(within(nav).getByText('Departments')).toBeDefined();
    expect(within(nav).getByText('Department')).toBeDefined();
    expect(within(nav).getByText('Tickets')).toBeDefined();
    expect(screen.queryByText(new RegExp(deptUuid, 'i'))).toBeNull();
  });

  it('never renders a raw UUID in ticket route and renders registered label or fallback', () => {
    const ticketUuid = 'a0b1c2d3-0000-0000-0000-000000000001';
    useBreadcrumbStore.getState().setLabel(ticketUuid, 'TECH-2');

    render(
      <MemoryRouter initialEntries={[`/tickets/${ticketUuid}`]}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="tickets/:ticketId" element={<div>Ticket Details Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(nav).getByText('Home')).toBeDefined();
    expect(within(nav).getByText('Tickets')).toBeDefined();
    expect(within(nav).getByText('TECH-2')).toBeDefined();
    expect(screen.queryByText(new RegExp(ticketUuid, 'i'))).toBeNull();
  });

  it('never renders a raw UUID in ticket type admin route', () => {
    const typeUuid = 'f5e6d7c8-0000-0000-0000-000000000099';
    useBreadcrumbStore.getState().setLabel(typeUuid, 'Laptop Request');

    render(
      <MemoryRouter initialEntries={[`/admin/ticket-types/${typeUuid}/edit`]}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="admin/ticket-types/:id/edit" element={<div>Ticket Type Edit Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(nav).getByText('Home')).toBeDefined();
    expect(within(nav).getByText('Admin')).toBeDefined();
    expect(within(nav).getByText('Ticket Types')).toBeDefined();
    expect(within(nav).getByText('Laptop Request')).toBeDefined();
    expect(within(nav).getByText('Edit')).toBeDefined();
    expect(screen.queryByText(new RegExp(typeUuid, 'i'))).toBeNull();
  });

  it('formats kebab-case routes into readable title case', () => {
    render(
      <MemoryRouter initialEntries={['/org-chart']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="org-chart" element={<div>Org Chart</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(nav).getByText('Home')).toBeDefined();
    expect(within(nav).getByText('Organization Chart')).toBeDefined();
  });
});

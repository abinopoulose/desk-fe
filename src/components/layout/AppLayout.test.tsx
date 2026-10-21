import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AppLayout } from './AppLayout';

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

let mockHasDepartmentAccess = true;
vi.mock('../../hooks', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useDepartmentAccess: () => ({
      hasDepartmentAccess: mockHasDepartmentAccess,
      myDepartments: [],
      isLoading: false,
      isInitialized: true,
      canEditAnyDept: false,
      refetch: vi.fn(),
    }),
  };
});

describe('AppLayout Top Navigation', () => {
  afterEach(() => {
    mockHasDepartmentAccess = true;
    cleanup();
  });

  const routesToTest = [
    { name: 'Dashboard', path: '/dashboard', expectedTitle: 'Dashboard' },
    { name: 'User Profile', path: '/users/abino', expectedTitle: 'My Profile' },
    { name: 'Other User Profile', path: '/users/abino.poulose.123', expectedTitle: 'User Profile' },
    { name: 'Department Tickets', path: '/department-tickets', expectedTitle: 'Department Tickets' },
    { name: 'Department Details Tickets', path: '/departments/c3cf6db0-0000-0000-0000-000000000020/tickets', expectedTitle: 'Department Tickets' },
    { name: 'Department Members', path: '/departments/c3cf6db0-0000-0000-0000-000000000020/members', expectedTitle: 'Department Members' },
    { name: 'Ticket Details', path: '/tickets/a0b1c2d3-0000-0000-0000-000000000001', expectedTitle: 'Ticket Details' },
    { name: 'Admin Ticket Types Edit', path: '/admin/ticket-types/f5e6d7c8-0000-0000-0000-000000000099/edit', expectedTitle: 'Edit Ticket Type' },
    { name: 'Org Chart', path: '/org-chart', expectedTitle: 'Organization Chart' },
    { name: 'Admin Employees', path: '/admin/employees', expectedTitle: 'Employees' },
  ];

  routesToTest.forEach(({ name, path, expectedTitle }) => {
    it(`renders page heading "${expectedTitle}" and no breadcrumbs on ${name} (${path})`, () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route path="*" element={<div>{name} Page Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1, name: expectedTitle })).toBeDefined();
      expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).toBeNull();
      expect(screen.queryByText('Home')).toBeNull();
    });
  });

  it('renders "Department Tickets" nav item when user has department access', () => {
    mockHasDepartmentAccess = true;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="dashboard" element={<div>Dashboard Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Department Tickets')).toBeDefined();
  });

  it('does NOT render "Department Tickets" nav item when user has no department access', () => {
    mockHasDepartmentAccess = false;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="dashboard" element={<div>Dashboard Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Department Tickets')).toBeNull();
  });
});

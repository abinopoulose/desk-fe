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

describe('AppLayout Top Navigation', () => {
  afterEach(() => {
    cleanup();
  });

  const routesToTest = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'User Profile', path: '/users/abino' },
    { name: 'Other User Profile', path: '/users/abino.poulose.123' },
    { name: 'Department Tickets', path: '/department-tickets' },
    { name: 'Department Details Tickets', path: '/departments/c3cf6db0-0000-0000-0000-000000000020/tickets' },
    { name: 'Department Members', path: '/departments/c3cf6db0-0000-0000-0000-000000000020/members' },
    { name: 'Ticket Details', path: '/tickets/a0b1c2d3-0000-0000-0000-000000000001' },
    { name: 'Admin Ticket Types Edit', path: '/admin/ticket-types/f5e6d7c8-0000-0000-0000-000000000099/edit' },
    { name: 'Org Chart', path: '/org-chart' },
    { name: 'Admin Employees', path: '/admin/employees' },
  ];

  routesToTest.forEach(({ name, path }) => {
    it(`does not render top breadcrumbs on ${name} (${path})`, () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route path="*" element={<div>{name} Page Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).toBeNull();
      expect(screen.queryByText('Home')).toBeNull();
    });
  });
});

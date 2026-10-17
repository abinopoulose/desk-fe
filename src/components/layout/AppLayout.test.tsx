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

describe('AppLayout Breadcrumbs', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders Home / Users / abino for /users/abino', () => {
    render(
      <MemoryRouter initialEntries={['/users/abino']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="users/:userId" element={<div>User Profile Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Users')).toBeDefined();
    expect(screen.getByText('abino')).toBeDefined();
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

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Users')).toBeDefined();
    expect(screen.getByText('abino.poulose.123')).toBeDefined();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ManageDepartmentPage } from './ManageDepartmentPage';
import { departmentApi } from '../../api/departmentApi';

vi.mock('../../api/departmentApi');
vi.mock('../../api/employeeApi');
vi.mock('../../store/authStore', () => ({
  useAuth: () => ({
    user: { id: 'user-1', fullName: 'Test User', email: 'test@abino.in' },
    isSuperAdmin: true,
    hasPrivilege: () => true,
  }),
}));

describe('ManageDepartmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders my departments and member list', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'IT',
        description: 'Information Technology',
        alphaTags: ['IT', 'TECH'],
        myRole: 'ADMIN',
        memberCount: 2,
      },
    ]);

    vi.mocked(departmentApi.getDepartmentMembers).mockResolvedValue([
      {
        id: 'dm-1',
        departmentId: 'dept-1',
        userId: 'u-1',
        displayId: 'USER-1',
        fullName: 'Ghinson K Varkey',
        email: 'ghinson@abino.in',
        role: 'ADMIN',
        joinedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'dm-2',
        departmentId: 'dept-1',
        userId: 'u-2',
        displayId: 'USER-2',
        fullName: 'John Doe',
        email: 'john@abino.in',
        role: 'MEMBER',
        joinedAt: '2026-01-02T00:00:00Z',
      },
    ]);

    render(<ManageDepartmentPage />);

    expect(screen.getByText('My Departments')).toBeDefined();

    await waitFor(() => {
      expect(screen.getAllByText('IT').length).toBeGreaterThan(0);
      expect(screen.getByText('Ghinson K Varkey')).toBeDefined();
      expect(screen.getByText('John Doe')).toBeDefined();
      expect(screen.getByText('Add Member')).toBeDefined();
    });
  });
});

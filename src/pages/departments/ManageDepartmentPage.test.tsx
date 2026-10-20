import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { DepartmentListPage } from './DepartmentListPage';
import { departmentApi } from '../../api/departmentApi';

vi.mock('../../api/departmentApi');
vi.mock('../../store/authStore', () => ({
  useAuth: () => ({
    user: { id: 'user-1', fullName: 'Test User', email: 'test@abino.in' },
    isSuperAdmin: false,
    hasPrivilege: () => false,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('DepartmentListPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('renders my departments list with role badges and actions', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'IT',
        description: 'Information Technology',
        alphaTags: ['IT', 'TECH'],
        myRole: 'ADMIN',
        memberCount: 5,
      },
      {
        id: 'dept-2',
        name: 'Finance',
        description: 'Accounts & payroll',
        alphaTags: ['FIN'],
        myRole: 'MEMBER',
        memberCount: 12,
      },
    ]);

    render(<DepartmentListPage />);

    expect(screen.getByPlaceholderText('Search departments by name, tag, or description...')).toBeDefined();

    await waitFor(() => {
      expect(screen.getAllByText('IT').length).toBeGreaterThan(0);
      expect(screen.getByText('Finance')).toBeDefined();
      expect(screen.getByText('Admin')).toBeDefined();
      expect(screen.getByText('Member')).toBeDefined();
      expect(screen.getByText('5')).toBeDefined();
      expect(screen.getByText('12')).toBeDefined();
    });

    // Check actions for admin department
    expect(screen.getByText('Manage Members')).toBeDefined();
    expect(screen.getByText('View Team Roster')).toBeDefined();
    expect(screen.getByText('Metrics')).toBeDefined();
    expect(screen.getAllByText('Tickets').length).toBe(2);
    expect(screen.queryByText('Open Tickets Queue')).toBeNull();
  });

  it('filters departments using search input', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'Information Technology',
        description: 'Computers and support',
        alphaTags: ['IT'],
        myRole: 'ADMIN',
        memberCount: 5,
      },
      {
        id: 'dept-2',
        name: 'Finance',
        description: 'Accounts & payroll',
        alphaTags: ['FIN'],
        myRole: 'MEMBER',
        memberCount: 12,
      },
    ]);

    render(<DepartmentListPage />);

    await waitFor(() => {
      expect(screen.getByText('Information Technology')).toBeDefined();
      expect(screen.getByText('Finance')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/search departments by name/i);
    fireEvent.change(searchInput, { target: { value: 'Finance' } });

    expect(screen.queryByText('Information Technology')).toBeNull();
    expect(screen.getByText('Finance')).toBeDefined();
  });
});

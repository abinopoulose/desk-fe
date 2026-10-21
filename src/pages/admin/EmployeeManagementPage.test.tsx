import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { EmployeeManagementPage } from './EmployeeManagementPage';
import * as empHook from '../../hooks/useEmployeeManagement';
import type { User } from '../../types/user';

vi.mock('../../components/auth/PrivilegeGate', () => ({
  PrivilegeGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../hooks/useOrgChart', () => ({
  useOrgChart: () => ({
    orgData: [
      {
        id: 'usr-1',
        fullName: 'Alice Walker',
        email: 'alice@company.com',
        title: 'CEO',
        displayId: 'EMP-001',
        departmentName: 'Executive',
        children: [],
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('EmployeeManagementPage Component', () => {
  const mockUsers: User[] = [
    {
      id: 'usr-1',
      fullName: 'Alice Walker',
      email: 'alice@company.com',
      title: 'Head of Support',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    },
    {
      id: 'usr-2',
      fullName: 'Bob Smith',
      email: 'bob@company.com',
      title: 'Customer Advocate',
      roles: ['AGENT'],
      status: 'PENDING',
    },
  ];

  const mockHandleInvite = vi.fn();
  const mockHandleResendInvite = vi.fn();
  const mockHandleUpdateEmployee = vi.fn();
  const mockSetIsInviteModalOpen = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders employee directory, summary stats cards, and staff rows', () => {
    vi.spyOn(empHook, 'useEmployeeManagement').mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      inviteError: null,
      isInviteModalOpen: false,
      setIsInviteModalOpen: mockSetIsInviteModalOpen,
      inviteLoading: false,
      handleInvite: mockHandleInvite,
      handleResendInvite: mockHandleResendInvite,
      handleUpdateEmployee: mockHandleUpdateEmployee,
      updateLoading: false,
      updateError: null,
      refresh: mockRefresh,
    });

    render(
      <MemoryRouter>
        <EmployeeManagementPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Invite Employee')).toBeDefined();
    expect(screen.getByText('Total Employees')).toBeDefined();
    expect(screen.getByText('Active Staff')).toBeDefined();
    expect(screen.getByText('Pending Invites')).toBeDefined();
    expect(screen.getByText('Alice Walker')).toBeDefined();
    expect(screen.getByText('Bob Smith')).toBeDefined();
    expect(screen.getByText('Pending Invite')).toBeDefined();
  });

  it('filters staff by search query input', () => {
    vi.spyOn(empHook, 'useEmployeeManagement').mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      inviteError: null,
      isInviteModalOpen: false,
      setIsInviteModalOpen: mockSetIsInviteModalOpen,
      inviteLoading: false,
      handleInvite: mockHandleInvite,
      handleResendInvite: mockHandleResendInvite,
      handleUpdateEmployee: mockHandleUpdateEmployee,
      updateLoading: false,
      updateError: null,
      refresh: mockRefresh,
    });

    render(
      <MemoryRouter>
        <EmployeeManagementPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search staff by name, email, or job title...');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(screen.getByText('Alice Walker')).toBeDefined();
    expect(screen.queryByText('Bob Smith')).toBeNull();
  });

  it('opens the invite employee modal when button is clicked', () => {
    vi.spyOn(empHook, 'useEmployeeManagement').mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      inviteError: null,
      isInviteModalOpen: false,
      setIsInviteModalOpen: mockSetIsInviteModalOpen,
      inviteLoading: false,
      handleInvite: mockHandleInvite,
      handleResendInvite: mockHandleResendInvite,
      handleUpdateEmployee: mockHandleUpdateEmployee,
      updateLoading: false,
      updateError: null,
      refresh: mockRefresh,
    });

    render(
      <MemoryRouter>
        <EmployeeManagementPage />
      </MemoryRouter>
    );

    const inviteBtn = screen.getByText('Invite Employee');
    fireEvent.click(inviteBtn);

    expect(mockSetIsInviteModalOpen).toHaveBeenCalledWith(true);
  });

  it('opens the edit modal when Edit button is clicked and submits changes', () => {
    vi.spyOn(empHook, 'useEmployeeManagement').mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      inviteError: null,
      isInviteModalOpen: false,
      setIsInviteModalOpen: mockSetIsInviteModalOpen,
      inviteLoading: false,
      handleInvite: mockHandleInvite,
      handleResendInvite: mockHandleResendInvite,
      handleUpdateEmployee: mockHandleUpdateEmployee,
      updateLoading: false,
      updateError: null,
      refresh: mockRefresh,
    });

    render(
      <MemoryRouter>
        <EmployeeManagementPage />
      </MemoryRouter>
    );

    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    expect(editBtns.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(editBtns[0]);

    expect(screen.getByText('Edit Employee')).toBeDefined();
    expect(screen.getByDisplayValue('alice@company.com')).toBeDefined();

    const nameInput = screen.getByDisplayValue('Alice Walker');
    fireEvent.change(nameInput, { target: { value: 'Alice Smith' } });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    expect(mockHandleUpdateEmployee).toHaveBeenCalledWith('usr-1', expect.objectContaining({
      fullName: 'Alice Smith',
      isActive: true,
    }));
  });

  it('paginates 50 employees per page and navigates between pages', () => {
    // Generate 65 mock employees
    const manyUsers: User[] = Array.from({ length: 65 }, (_, i) => ({
      id: `usr-${i + 1}`,
      fullName: `Employee ${i + 1}`,
      email: `employee${i + 1}@company.com`,
      title: 'Engineer',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    }));

    vi.spyOn(empHook, 'useEmployeeManagement').mockReturnValue({
      users: manyUsers,
      loading: false,
      error: null,
      inviteError: null,
      isInviteModalOpen: false,
      setIsInviteModalOpen: mockSetIsInviteModalOpen,
      inviteLoading: false,
      handleInvite: mockHandleInvite,
      handleResendInvite: mockHandleResendInvite,
      handleUpdateEmployee: mockHandleUpdateEmployee,
      updateLoading: false,
      updateError: null,
      refresh: mockRefresh,
    });

    render(
      <MemoryRouter>
        <EmployeeManagementPage />
      </MemoryRouter>
    );

    // Should show 1 to 50 of 65 employees on page 1
    expect(screen.getByText('Employee 1')).toBeDefined();
    expect(screen.getByText('Employee 50')).toBeDefined();
    expect(screen.queryByText('Employee 51')).toBeNull();
    expect(screen.getByText('Page 1 of 2')).toBeDefined();

    // Click next page
    const nextBtn = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextBtn);

    // Should show page 2 (employees 51 to 65)
    expect(screen.getByText('Page 2 of 2')).toBeDefined();
    expect(screen.getByText('Employee 51')).toBeDefined();
    expect(screen.getByText('Employee 65')).toBeDefined();
    expect(screen.queryByText('Employee 1')).toBeNull();
  }, 15000);

  it('switches between Employee Directory and Organization Tree tabs', () => {
    vi.spyOn(empHook, 'useEmployeeManagement').mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      inviteError: null,
      isInviteModalOpen: false,
      setIsInviteModalOpen: mockSetIsInviteModalOpen,
      inviteLoading: false,
      handleInvite: mockHandleInvite,
      handleResendInvite: mockHandleResendInvite,
      handleUpdateEmployee: mockHandleUpdateEmployee,
      updateLoading: false,
      updateError: null,
      refresh: mockRefresh,
    });

    render(
      <MemoryRouter initialEntries={['/admin/employees']}>
        <EmployeeManagementPage />
      </MemoryRouter>
    );

    // Initial view: Directory
    expect(screen.getByText('Employee Directory')).toBeDefined();
    expect(screen.getByText('Organization Tree')).toBeDefined();
    expect(screen.getByText('Total Employees')).toBeDefined();

    // Switch to Organization Tree
    fireEvent.click(screen.getByRole('button', { name: /organization tree/i }));

    // Tree view toolbar and controls should be displayed
    expect(screen.getByPlaceholderText('Search tree by name, role, email...')).toBeDefined();
    expect(screen.getByRole('button', { name: /expand all/i })).toBeDefined();

    // Switch back to Employee Directory
    fireEvent.click(screen.getByRole('button', { name: /employee directory/i }));
    expect(screen.getByText('Total Employees')).toBeDefined();
  });

  it('renders Organization Tree view directly when initial route has view=tree', () => {
    vi.spyOn(empHook, 'useEmployeeManagement').mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      inviteError: null,
      isInviteModalOpen: false,
      setIsInviteModalOpen: mockSetIsInviteModalOpen,
      inviteLoading: false,
      handleInvite: mockHandleInvite,
      handleResendInvite: mockHandleResendInvite,
      handleUpdateEmployee: mockHandleUpdateEmployee,
      updateLoading: false,
      updateError: null,
      refresh: mockRefresh,
    });

    render(
      <MemoryRouter initialEntries={['/admin/employees?view=tree']}>
        <EmployeeManagementPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Search tree by name, role, email...')).toBeDefined();
    expect(screen.queryByText('Total Employees')).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DepartmentAdminPage } from './DepartmentAdminPage';
import * as deptHook from '../../hooks/useDepartments';

vi.mock('../../components/auth/PrivilegeGate', () => ({
  PrivilegeGate: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('DepartmentAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders department list and header correctly', () => {
    vi.spyOn(deptHook, 'useDepartments').mockReturnValue({
      departments: [
        { id: 'd-1', name: 'Engineering', description: 'Software & Infrastructure', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'd-2', name: 'Customer Support', description: 'Client queries & helpdesk', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ],
      loading: false,
      error: null,
      formState: { name: '', description: '', managerId: '' },
      setFormField: vi.fn(),
      isEditing: false,
      startEdit: vi.fn(),
      cancelEdit: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      refetch: vi.fn(),
    });

    render(<DepartmentAdminPage />);

    expect(screen.getByText('Departments')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
    expect(screen.getByText('Customer Support')).toBeDefined();
    expect(screen.getByText('Software & Infrastructure')).toBeDefined();
  });

  it('filters departments using the search bar', () => {
    vi.spyOn(deptHook, 'useDepartments').mockReturnValue({
      departments: [
        { id: 'd-1', name: 'Engineering', description: 'Software', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'd-2', name: 'Finance', description: 'Payroll & accounts', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ],
      loading: false,
      error: null,
      formState: { name: '', description: '', managerId: '' },
      setFormField: vi.fn(),
      isEditing: false,
      startEdit: vi.fn(),
      cancelEdit: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      refetch: vi.fn(),
    });

    render(<DepartmentAdminPage />);

    const searchInput = screen.getByPlaceholderText('Search departments...');
    fireEvent.change(searchInput, { target: { value: 'finance' } });

    expect(screen.getByText('Finance')).toBeDefined();
    expect(screen.queryByText('Engineering')).toBeNull();
  });

  it('opens create modal when Add Department button is clicked', () => {
    const startEditMock = vi.fn();
    vi.spyOn(deptHook, 'useDepartments').mockReturnValue({
      departments: [],
      loading: false,
      error: null,
      formState: { name: '', description: '', managerId: '' },
      setFormField: vi.fn(),
      isEditing: false,
      startEdit: startEditMock,
      cancelEdit: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      refetch: vi.fn(),
    });

    render(<DepartmentAdminPage />);

    const addBtn = screen.getByRole('button', { name: /Add Department/i });
    fireEvent.click(addBtn);

    expect(startEditMock).toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Create Department' })).toBeDefined();
  });
});

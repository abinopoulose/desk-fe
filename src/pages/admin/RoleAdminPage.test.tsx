import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RoleAdminPage } from './RoleAdminPage';
import * as rolesHook from '../../hooks/useRoles';

describe('RoleAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders role list and header correctly', () => {
    vi.spyOn(rolesHook, 'useRoles').mockReturnValue({
      roles: [
        { id: '1', roleName: 'ADMIN', description: 'System Administrator', privileges: ['ADMIN_FULL_ACCESS'] },
        { id: '2', roleName: 'SUPPORT_AGENT', description: 'Helpdesk agent', privileges: ['TICKET_READ', 'TICKET_WRITE'] },
      ],
      data: null,
      loading: false,
      error: null,
      formState: { name: '', description: '', permissions: [] },
      setFormField: vi.fn(),
      togglePermission: vi.fn(),
      isEditing: false,
      editingRole: null,
      isModalOpen: false,
      startEdit: vi.fn(),
      openModal: vi.fn(),
      cancelEdit: vi.fn(),
      closeModal: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      refetch: vi.fn(),
      fetchRoles: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      assignRoles: vi.fn(),
      fetchUserRoles: vi.fn(),
    });

    render(<RoleAdminPage />);

    expect(screen.getByText('Roles & Permissions')).toBeDefined();
    expect(screen.getByText('ADMIN')).toBeDefined();
    expect(screen.getByText('SUPPORT_AGENT')).toBeDefined();
    expect(screen.getByText('Admin Full Access')).toBeDefined();
  });

  it('filters roles using search bar', () => {
    vi.spyOn(rolesHook, 'useRoles').mockReturnValue({
      roles: [
        { id: '1', roleName: 'ADMIN', description: 'System Administrator', privileges: ['ADMIN_FULL_ACCESS'] },
        { id: '2', roleName: 'SUPPORT_AGENT', description: 'Helpdesk agent', privileges: ['TICKET_READ'] },
      ],
      data: null,
      loading: false,
      error: null,
      formState: { name: '', description: '', permissions: [] },
      setFormField: vi.fn(),
      togglePermission: vi.fn(),
      isEditing: false,
      editingRole: null,
      isModalOpen: false,
      startEdit: vi.fn(),
      openModal: vi.fn(),
      cancelEdit: vi.fn(),
      closeModal: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      refetch: vi.fn(),
      fetchRoles: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      assignRoles: vi.fn(),
      fetchUserRoles: vi.fn(),
    });

    render(<RoleAdminPage />);

    const searchInput = screen.getByPlaceholderText('Search roles or privileges...');
    fireEvent.change(searchInput, { target: { value: 'support' } });

    expect(screen.getByText('SUPPORT_AGENT')).toBeDefined();
    expect(screen.queryByText('ADMIN')).toBeNull();
  });

  it('renders modal with categorized permissions when isModalOpen is true', () => {
    vi.spyOn(rolesHook, 'useRoles').mockReturnValue({
      roles: [],
      data: null,
      loading: false,
      error: null,
      formState: { name: 'SECURITY_AUDITOR', description: 'Audits access', permissions: ['AUDIT_READ'] },
      setFormField: vi.fn(),
      togglePermission: vi.fn(),
      isEditing: false,
      editingRole: null,
      isModalOpen: true,
      startEdit: vi.fn(),
      openModal: vi.fn(),
      cancelEdit: vi.fn(),
      closeModal: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      refetch: vi.fn(),
      fetchRoles: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      assignRoles: vi.fn(),
      fetchUserRoles: vi.fn(),
    });

    render(<RoleAdminPage />);

    expect(screen.getByText('Create New Role')).toBeDefined();
    expect(screen.getByText('Ticket Management')).toBeDefined();
    expect(screen.getByText('Users & Access Control')).toBeDefined();
    expect(screen.getByText('Departments & Folders')).toBeDefined();
    expect(screen.getByText('SLA, Analytics & Administration')).toBeDefined();
    expect(screen.getByText('Select All')).toBeDefined();
  });
});

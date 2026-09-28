import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { RoleAdminPage } from '../RoleAdminPage';
import { getAllRoles, createRole, assignRoles, getUserRoles } from '../../../api/roleApi';
import { getAllUsers } from '../../../api/userApi';
import { BrowserRouter } from 'react-router';

// Mock the PrivilegeGate so it just renders children
vi.mock('../../../components/auth/PrivilegeGate', () => ({
  PrivilegeGate: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('../../../api/roleApi', () => ({
  getAllRoles: vi.fn(),
  createRole: vi.fn(),
  assignRoles: vi.fn(),
  getUserRoles: vi.fn(),
}));

vi.mock('../../../api/userApi', () => ({
  getAllUsers: vi.fn(),
}));

describe('RoleAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllRoles).mockResolvedValue([
      { roleName: 'ADMIN', privileges: ['USER_READ', 'USER_WRITE'] }
    ]);
    vi.mocked(getAllUsers).mockResolvedValue({
      users: [{ id: 'u1', fullName: 'John Doe', email: 'john@example.com' }],
      totalElements: 1,
      totalPages: 1,
      currentPage: 0
    });
  });
  
  afterEach(() => {
    cleanup();
  });

  it('renders a list of roles and users', async () => {
    render(
      <BrowserRouter>
        <RoleAdminPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading roles...')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.getByText('Role Management')).toBeTruthy();
      expect(screen.getByText('ADMIN')).toBeTruthy();
      expect(screen.getByText('USER_READ')).toBeTruthy();
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('john@example.com')).toBeTruthy();
    });
  });

  it('opens create role modal and creates a role', async () => {
    vi.mocked(createRole).mockResolvedValueOnce({
      roleName: 'CUSTOM_ROLE', privileges: ['ROLE_READ']
    });

    render(
      <BrowserRouter>
        <RoleAdminPage />
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText('ADMIN')).toBeTruthy());

    fireEvent.click(screen.getByText('Create Role'));
    expect(screen.getAllByText('Create Role')).toBeTruthy();

    const nameInput = screen.getByLabelText('Role Name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'CUSTOM_ROLE' } });
    
    const checkbox = screen.getByLabelText('ROLE_READ');
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByText('Save Role'));

    await waitFor(() => {
      expect(createRole).toHaveBeenCalledWith({
        roleName: 'CUSTOM_ROLE',
        privileges: ['ROLE_READ']
      });
      expect(getAllRoles).toHaveBeenCalledTimes(2);
    });
  });

  it('opens assign roles modal and assigns a role to user', async () => {
    vi.mocked(getUserRoles).mockResolvedValueOnce(['ADMIN']);
    vi.mocked(assignRoles).mockResolvedValueOnce(undefined);

    render(
      <BrowserRouter>
        <RoleAdminPage />
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText('John Doe')).toBeTruthy());

    fireEvent.click(screen.getByText('Manage Roles'));
    
    await waitFor(() => {
      expect(screen.getByText('Assign Roles for John Doe')).toBeTruthy();
    });

    const checkbox = screen.getAllByLabelText('ADMIN')[0];
    fireEvent.click(checkbox); // unchecks ADMIN

    fireEvent.click(screen.getByText('Save Assignment'));

    await waitFor(() => {
      expect(assignRoles).toHaveBeenCalledWith('u1', []);
    });
  });
});

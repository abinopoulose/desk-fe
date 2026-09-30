import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { RoleAdminPage } from '../pages/admin/RoleAdminPage';
import { roleApi } from '../api/roleApi';
import { useAuthStore } from '../store/authStore';
import type { RoleDTO } from '../types/role';

vi.mock('../api/roleApi', () => ({
  roleApi: {
    getAllRoles: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    assignRoles: vi.fn(),
    getUserRoles: vi.fn(),
  },
}));

describe('RoleAdminPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ privileges: ['ROLE_WRITE'] });
  });

  afterEach(() => {
    cleanup();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <RoleAdminPage />
      </MemoryRouter>
    );
  };

  it('renders and fetches roles on mount', async () => {
    const mockRoles: RoleDTO[] = [
      { roleName: 'ADMIN', description: 'Administrator', privileges: ['USER_READ', 'ROLE_WRITE'] },
    ];
    vi.mocked(roleApi.getAllRoles).mockResolvedValueOnce(mockRoles);

    renderPage();

    expect(screen.getByText('Loading roles...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
    });

    expect(roleApi.getAllRoles).toHaveBeenCalled();
  });

  it('renders empty state when no roles found', async () => {
    vi.mocked(roleApi.getAllRoles).mockResolvedValueOnce([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No roles found.')).toBeInTheDocument();
    });
  });

  it('opens create modal, toggles permissions, and creates role', async () => {
    vi.mocked(roleApi.getAllRoles).mockResolvedValue([]);
    const createdRole: RoleDTO = { roleName: 'TEST_AGENT', description: 'Testing Agent', privileges: ['TICKET_READ'] };
    vi.mocked(roleApi.createRole).mockResolvedValueOnce(createdRole);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Create Role')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Role'));

    expect(screen.getByLabelText(/Role Name/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Role Name/i), { target: { value: 'TEST_AGENT' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Testing Agent' } });

    // Click permission checkbox
    const ticketReadCheckbox = screen.getByLabelText(/Read Tickets/i);
    fireEvent.click(ticketReadCheckbox);

    fireEvent.click(screen.getByText('Save Role'));

    await waitFor(() => {
      expect(roleApi.createRole).toHaveBeenCalledWith({
        roleName: 'TEST_AGENT',
        description: 'Testing Agent',
        privileges: expect.arrayContaining(['TICKET_READ']),
      });
    });
  });

  it('opens edit modal and updates role', async () => {
    const mockRoles: RoleDTO[] = [
      { roleName: 'SUPPORT', description: 'Support Agent', privileges: ['TICKET_READ'] },
    ];
    vi.mocked(roleApi.getAllRoles).mockResolvedValue(mockRoles);
    vi.mocked(roleApi.updateRole).mockResolvedValueOnce({
      roleName: 'SUPPORT',
      description: 'Senior Support Agent',
      privileges: ['TICKET_READ', 'TICKET_WRITE'],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('SUPPORT')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByText('Edit Role')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SUPPORT')).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Senior Support Agent' } });
    fireEvent.click(screen.getByLabelText(/Create\/Edit Tickets/i));

    fireEvent.click(screen.getByText('Update Role'));

    await waitFor(() => {
      expect(roleApi.updateRole).toHaveBeenCalledWith('SUPPORT', {
        roleName: 'SUPPORT',
        description: 'Senior Support Agent',
        privileges: expect.arrayContaining(['TICKET_READ', 'TICKET_WRITE']),
      });
    });
  });

  it('deletes role when confirmed', async () => {
    const mockRoles: RoleDTO[] = [
      { roleName: 'OBSOLETE', description: 'Old role', privileges: [] },
    ];
    vi.mocked(roleApi.getAllRoles).mockResolvedValue(mockRoles);
    vi.mocked(roleApi.deleteRole).mockResolvedValueOnce(undefined);
    window.confirm = vi.fn().mockReturnValue(true);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('OBSOLETE')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(roleApi.deleteRole).toHaveBeenCalledWith('OBSOLETE');
    });
  });
});

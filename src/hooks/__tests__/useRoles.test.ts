import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoles } from '../useRoles';
import { roleApi } from '../../api/roleApi';
import type { RoleDTO } from '../../types/role';

vi.mock('../../api/roleApi', () => ({
  roleApi: {
    getAllRoles: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    assignRoles: vi.fn(),
    getUserRoles: vi.fn(),
  },
}));

describe('useRoles hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches roles successfully', async () => {
    const mockRoles: RoleDTO[] = [{ roleName: 'ADMIN', privileges: ['ALL'] }];
    vi.mocked(roleApi.getAllRoles).mockResolvedValueOnce(mockRoles);

    const { result } = renderHook(() => useRoles());

    await act(async () => {
      const res = await result.current.fetchRoles();
      expect(res).toEqual(mockRoles);
    });

    expect(result.current.data).toEqual(mockRoles);
    expect(result.current.roles).toEqual(mockRoles);
    expect(result.current.loading).toBe(false);
  });

  it('creates role, assigns role, and gets user roles', async () => {
    const mockRole: RoleDTO = { roleName: 'AGENT', privileges: ['TICKET_WRITE'] };
    const mockUserRoles = { userId: 'u1', roles: ['AGENT'] };

    vi.mocked(roleApi.createRole).mockResolvedValueOnce(mockRole);
    vi.mocked(roleApi.assignRoles).mockResolvedValueOnce(undefined);
    vi.mocked(roleApi.getUserRoles).mockResolvedValueOnce(mockUserRoles);

    const { result } = renderHook(() => useRoles());

    await act(async () => {
      const created = await result.current.createRole({ roleName: 'AGENT', privileges: ['TICKET_WRITE'] });
      expect(created).toEqual(mockRole);

      await result.current.assignRoles('u1', { roles: ['AGENT'] });

      const userRoles = await result.current.fetchUserRoles('u1');
      expect(userRoles).toEqual(mockUserRoles);
    });

    expect(roleApi.assignRoles).toHaveBeenCalledWith('u1', { roles: ['AGENT'] });
  });

  it('handles fetchRoles error', async () => {
    vi.mocked(roleApi.getAllRoles).mockRejectedValueOnce(new Error('Roles error'));

    const { result } = renderHook(() => useRoles());

    await act(async () => {
      try {
        await result.current.fetchRoles();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Roles error');
  });

  it('updates role and deletes role directly', async () => {
    const updatedRole: RoleDTO = { roleName: 'SUPPORT', description: 'Support role', privileges: ['TICKET_READ'] };
    vi.mocked(roleApi.updateRole).mockResolvedValueOnce(updatedRole);
    vi.mocked(roleApi.deleteRole).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useRoles());

    await act(async () => {
      const res = await result.current.updateRole('SUPPORT', {
        roleName: 'SUPPORT',
        description: 'Support role',
        privileges: ['TICKET_READ'],
      });
      expect(res).toEqual(updatedRole);

      await result.current.deleteRole('SUPPORT');
    });

    expect(roleApi.updateRole).toHaveBeenCalledWith('SUPPORT', {
      roleName: 'SUPPORT',
      description: 'Support role',
      privileges: ['TICKET_READ'],
    });
    expect(roleApi.deleteRole).toHaveBeenCalledWith('SUPPORT');
  });

  it('manages formState with setFormField and togglePermission', () => {
    const { result } = renderHook(() => useRoles());

    act(() => {
      result.current.setFormField('name', 'TEST_ROLE');
      result.current.setFormField('description', 'Test Description');
    });

    expect(result.current.formState.name).toBe('TEST_ROLE');
    expect(result.current.formState.description).toBe('Test Description');

    act(() => {
      result.current.togglePermission('USER_READ');
    });
    expect(result.current.formState.permissions).toContain('USER_READ');

    act(() => {
      result.current.togglePermission('ROLE_READ');
    });
    expect(result.current.formState.permissions).toEqual(['USER_READ', 'ROLE_READ']);

    act(() => {
      result.current.togglePermission('USER_READ');
    });
    expect(result.current.formState.permissions).toEqual(['ROLE_READ']);
  });

  it('starts edit mode with role data and cancels edit', () => {
    const { result } = renderHook(() => useRoles());

    const sampleRole: RoleDTO = {
      roleName: 'MANAGER',
      description: 'Manager role',
      privileges: ['USER_READ', 'TICKET_READ'],
    };

    act(() => {
      result.current.startEdit(sampleRole);
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.editingRole).toEqual(sampleRole);
    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.formState.name).toBe('MANAGER');
    expect(result.current.formState.description).toBe('Manager role');
    expect(result.current.formState.permissions).toEqual(['USER_READ', 'TICKET_READ']);

    act(() => {
      result.current.cancelEdit();
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.editingRole).toBeNull();
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.formState.name).toBe('');
    expect(result.current.formState.description).toBe('');
    expect(result.current.formState.permissions).toEqual([]);
  });

  it('saves new role in create mode and refetches', async () => {
    const newRole: RoleDTO = {
      roleName: 'NEW_ROLE',
      description: 'A new role',
      privileges: ['TICKET_READ'],
    };
    vi.mocked(roleApi.createRole).mockResolvedValueOnce(newRole);
    vi.mocked(roleApi.getAllRoles).mockResolvedValueOnce([newRole]);

    const { result } = renderHook(() => useRoles());

    act(() => {
      result.current.startEdit();
      result.current.setFormField('name', 'NEW_ROLE');
      result.current.setFormField('description', 'A new role');
      result.current.togglePermission('TICKET_READ');
    });

    await act(async () => {
      const res = await result.current.save();
      expect(res).toEqual(newRole);
    });

    expect(roleApi.createRole).toHaveBeenCalledWith({
      roleName: 'NEW_ROLE',
      description: 'A new role',
      privileges: ['TICKET_READ'],
    });
    expect(roleApi.getAllRoles).toHaveBeenCalled();
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.roles).toEqual([newRole]);
  });

  it('saves updated role in edit mode and refetches', async () => {
    const existingRole: RoleDTO = {
      roleName: 'DEV',
      description: 'Developer',
      privileges: ['USER_READ'],
    };
    const updatedRole: RoleDTO = {
      roleName: 'DEV',
      description: 'Senior Developer',
      privileges: ['USER_READ', 'TICKET_WRITE'],
    };

    vi.mocked(roleApi.updateRole).mockResolvedValueOnce(updatedRole);
    vi.mocked(roleApi.getAllRoles).mockResolvedValueOnce([updatedRole]);

    const { result } = renderHook(() => useRoles());

    act(() => {
      result.current.startEdit(existingRole);
      result.current.setFormField('description', 'Senior Developer');
      result.current.togglePermission('TICKET_WRITE');
    });

    await act(async () => {
      const res = await result.current.save();
      expect(res).toEqual(updatedRole);
    });

    expect(roleApi.updateRole).toHaveBeenCalledWith('DEV', {
      roleName: 'DEV',
      description: 'Senior Developer',
      privileges: ['USER_READ', 'TICKET_WRITE'],
    });
    expect(roleApi.getAllRoles).toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  it('handles save error gracefully', async () => {
    vi.mocked(roleApi.createRole).mockRejectedValueOnce(new Error('Validation error'));

    const { result } = renderHook(() => useRoles());

    act(() => {
      result.current.startEdit();
      result.current.setFormField('name', 'ERR_ROLE');
    });

    let res: RoleDTO | null = null;
    await act(async () => {
      res = await result.current.save();
    });

    expect(res).toBeNull();
    expect(result.current.error).toBe('Validation error');
  });

  it('removes role with confirmation and refetches', async () => {
    vi.mocked(roleApi.deleteRole).mockResolvedValueOnce(undefined);
    vi.mocked(roleApi.getAllRoles).mockResolvedValueOnce([]);
    window.confirm = vi.fn().mockReturnValue(true);

    const { result } = renderHook(() => useRoles());

    await act(async () => {
      await result.current.remove('ROLE_TO_DELETE');
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(roleApi.deleteRole).toHaveBeenCalledWith('ROLE_TO_DELETE');
    expect(roleApi.getAllRoles).toHaveBeenCalled();
  });

  it('does not remove role if user cancels confirmation', async () => {
    window.confirm = vi.fn().mockReturnValue(false);

    const { result } = renderHook(() => useRoles());

    await act(async () => {
      await result.current.remove('ROLE_STAY');
    });

    expect(roleApi.deleteRole).not.toHaveBeenCalled();
  });

  it('handles remove error gracefully', async () => {
    vi.mocked(roleApi.deleteRole).mockRejectedValueOnce(new Error('Delete error'));

    const { result } = renderHook(() => useRoles());

    await act(async () => {
      await result.current.remove('FAIL_ROLE', true);
    });

    expect(result.current.error).toBe('Delete error');
  });

  it('autoFetches roles on mount when autoFetch is true and supports refetch', async () => {
    const mockRoles: RoleDTO[] = [{ roleName: 'TEST', privileges: [] }];
    vi.mocked(roleApi.getAllRoles).mockResolvedValueOnce(mockRoles);

    const { result } = renderHook(() => useRoles({ autoFetch: true }));

    await act(async () => {});

    expect(result.current.roles).toEqual(mockRoles);
    expect(roleApi.getAllRoles).toHaveBeenCalledTimes(1);

    vi.mocked(roleApi.getAllRoles).mockResolvedValueOnce([...mockRoles, { roleName: 'TEST2', privileges: [] }]);

    await act(async () => {
      await result.current.refetch();
    });

    expect(roleApi.getAllRoles).toHaveBeenCalledTimes(2);
    expect(result.current.roles).toHaveLength(2);
  });
});

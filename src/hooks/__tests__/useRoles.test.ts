import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoles } from '../useRoles';
import { roleApi } from '../../api/roleApi';

vi.mock('../../api/roleApi', () => ({
  roleApi: {
    getAllRoles: vi.fn(),
    createRole: vi.fn(),
    assignRoles: vi.fn(),
    getUserRoles: vi.fn(),
  },
}));

describe('useRoles hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches roles successfully', async () => {
    const mockRoles = [{ roleName: 'ADMIN', privileges: ['ALL'] }];
    vi.mocked(roleApi.getAllRoles).mockResolvedValueOnce(mockRoles);

    const { result } = renderHook(() => useRoles());

    await act(async () => {
      const res = await result.current.fetchRoles();
      expect(res).toEqual(mockRoles);
    });

    expect(result.current.data).toEqual(mockRoles);
    expect(result.current.loading).toBe(false);
  });

  it('creates role, assigns role, and gets user roles', async () => {
    const mockRole = { roleName: 'AGENT', privileges: ['TICKET_WRITE'] };
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
});

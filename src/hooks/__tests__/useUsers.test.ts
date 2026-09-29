import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsers } from '../useUsers';
import * as userApi from '../../api/userApi';

vi.mock('../../api/userApi', () => ({
  getUserProfile: vi.fn(),
  getOrgHierarchy: vi.fn(),
}));

describe('useUsers hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user profile and org hierarchy', async () => {
    const mockProfile = {
      id: 'u1',
      email: 'u1@example.com',
      fullName: 'User One',
      roles: ['USER'],
      isActive: true,
      manager: null,
      reportees: [],
    };
    const mockHierarchy = [{ id: 'u1', fullName: 'User One', email: 'u1@example.com', reports: [] }];

    vi.mocked(userApi.getUserProfile).mockResolvedValueOnce(mockProfile);
    vi.mocked(userApi.getOrgHierarchy).mockResolvedValueOnce(mockHierarchy);

    const { result } = renderHook(() => useUsers());

    expect(result.current.data.profile).toBeNull();
    expect(result.current.data.hierarchy).toBeNull();

    await act(async () => {
      const profile = await result.current.fetchUserProfile('u1');
      expect(profile).toEqual(mockProfile);
    });

    expect(result.current.data.profile).toEqual(mockProfile);

    await act(async () => {
      const hierarchy = await result.current.fetchOrgHierarchy('u1');
      expect(hierarchy).toEqual(mockHierarchy);
    });

    expect(result.current.data.hierarchy).toEqual(mockHierarchy);
    expect(result.current.loading).toBe(false);
  });

  it('handles errors on profile fetch', async () => {
    vi.mocked(userApi.getUserProfile).mockRejectedValueOnce(new Error('Profile error'));

    const { result } = renderHook(() => useUsers());

    await act(async () => {
      try {
        await result.current.fetchUserProfile('u1');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Profile error');
  });
});

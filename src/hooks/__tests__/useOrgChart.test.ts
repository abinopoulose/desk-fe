import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOrgChart } from '../useOrgChart';
import { getOrgHierarchy } from '../../api/userApi';
import type { OrgNode } from '../../types/user';

vi.mock('../../api/userApi', () => ({
  getOrgHierarchy: vi.fn(),
}));

describe('useOrgChart hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOrgData: OrgNode[] = [
    {
      user: {
        id: 'u1',
        fullName: 'Test User',
        email: 'test@example.com',
        title: 'CEO',
        departmentName: 'Executive',
        manager: null,
        roles: [],
        isActive: true,
      },
      children: [],
    },
  ];

  it('fetches org hierarchy automatically', async () => {
    vi.mocked(getOrgHierarchy).mockResolvedValueOnce(mockOrgData);

    const { result } = renderHook(() => useOrgChart());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orgData).toEqual(mockOrgData);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    vi.mocked(getOrgHierarchy).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useOrgChart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });
});

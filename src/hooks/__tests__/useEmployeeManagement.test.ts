import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmployeeManagement } from '../useEmployeeManagement';
import { getOrgUsers, inviteEmployee } from '../../api/employeeApi';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../api/employeeApi', () => ({
  getOrgUsers: vi.fn(),
  inviteEmployee: vi.fn(),
  resendInvitation: vi.fn()
}));

describe('useEmployeeManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch users on mount', async () => {
    const mockUsers = [{ id: '1', email: 'test@test.com', fullName: 'Test', roles: [] }];
    (getOrgUsers as any).mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useEmployeeManagement());
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.users).toEqual(mockUsers);
    expect(getOrgUsers).toHaveBeenCalled();
  });

  it('should handle invite employee', async () => {
    (getOrgUsers as any).mockResolvedValue([]);
    (inviteEmployee as any).mockResolvedValue({});
    
    const { result } = renderHook(() => useEmployeeManagement());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleInvite({ email: 'new@test.com', fullName: 'New User', roles: [] });
    });

    expect(inviteEmployee).toHaveBeenCalledWith({ email: 'new@test.com', fullName: 'New User', roles: [] });
  });
});

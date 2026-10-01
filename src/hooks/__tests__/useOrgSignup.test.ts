import { renderHook, act } from '@testing-library/react';
import { useOrgSignup } from '../useOrgSignup';
import { registerOrganization } from '../../api/organizationApi';
import { useAuthStore } from '../../store/authStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../api/organizationApi', () => ({ registerOrganization: vi.fn() }));
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn()
}));

describe('useOrgSignup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, privileges: [] });
  });

  it('should handle successful registration', async () => {
    const mockResponse = {
      data: { token: 'test-token', user: { id: '1', email: 'test@example.com', roles: [] } }
    };
    (registerOrganization as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOrgSignup());

    act(() => {
      result.current.setField('name', 'Acme Corp');
      result.current.setField('adminFullName', 'Admin');
      result.current.setField('adminEmail', 'admin@example.com');
      result.current.setField('password', 'password123');
      result.current.setField('confirmPassword', 'password123');
    });

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() } as any);
    });

    expect(registerOrganization).toHaveBeenCalledWith({
      name: 'Acme Corp',
      adminFullName: 'Admin',
      adminEmail: 'admin@example.com',
      password: 'password123'
    });
    expect(useAuthStore.getState().token).toBe('test-token');
  });

  it('should set error if passwords do not match', async () => {
    const { result } = renderHook(() => useOrgSignup());
    act(() => {
      result.current.setField('password', 'pass123');
      result.current.setField('confirmPassword', 'pass456');
    });

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.error).toBe('Passwords do not match');
    expect(registerOrganization).not.toHaveBeenCalled();
  });
});

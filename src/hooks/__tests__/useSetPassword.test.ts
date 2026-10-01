import { renderHook, act } from '@testing-library/react';
import { useSetPassword } from '../useSetPassword';
import { setPassword } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../api/authApi', () => ({ setPassword: vi.fn(), login: vi.fn(), register: vi.fn() }));
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams({ token: 'mock-token' })]
}));

describe('useSetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, privileges: [] });
  });

  it('should handle successful password set', async () => {
    const mockResponse = {
      token: 'test-token', user: { id: '1', email: 'test@example.com', roles: [] }
    };
    (setPassword as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSetPassword());

    act(() => {
      result.current.setField('password', 'password123');
      result.current.setField('confirmPassword', 'password123');
    });

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() } as any);
    });

    expect(setPassword).toHaveBeenCalledWith({
      token: 'mock-token',
      password: 'password123'
    });
    expect(useAuthStore.getState().token).toBe('test-token');
  });

  it('should set error if passwords do not match', async () => {
    const { result } = renderHook(() => useSetPassword());
    act(() => {
      result.current.setField('password', 'pass123');
      result.current.setField('confirmPassword', 'pass456');
    });

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.error).toBe('Passwords do not match');
    expect(setPassword).not.toHaveBeenCalled();
  });
});

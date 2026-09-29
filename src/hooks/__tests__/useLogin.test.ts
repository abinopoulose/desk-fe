import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogin } from '../useLogin';
import * as authApi from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

vi.mock('../../api/authApi', () => ({
  login: vi.fn(),
}));

describe('useLogin hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, privileges: [] });
  });

  it('initializes with default form state', () => {
    const { result } = renderHook(() => useLogin());

    expect(result.current.formState).toEqual({ email: '', password: '' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('updates form fields with setField', () => {
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setField('email', 'test@example.com');
      result.current.setField('password', 'password123');
    });

    expect(result.current.formState).toEqual({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('sets error when required fields are missing on submit', async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      const success = await result.current.submit();
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe('Please fill in all fields');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('successfully logs in and updates auth store', async () => {
    const mockUser = { id: '1', email: 'user@example.com', fullName: 'User', roles: ['ADMIN'] };
    vi.mocked(authApi.login).mockResolvedValueOnce({
      token: 'jwt-token',
      user: mockUser,
    });

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setField('email', 'user@example.com');
      result.current.setField('password', 'password123');
    });

    await act(async () => {
      const success = await result.current.submit();
      expect(success).toBe(true);
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('jwt-token');
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles 401 error', async () => {
    const axiosError = Object.assign(new Error(), {
      isAxiosError: true,
      name: 'AxiosError',
      response: { status: 401, data: {} },
    });
    vi.mocked(authApi.login).mockRejectedValueOnce(axiosError);

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setField('email', 'bad@example.com');
      result.current.setField('password', 'bad');
    });

    await act(async () => {
      const success = await result.current.submit();
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe('An unexpected error occurred');
    expect(result.current.loading).toBe(false);
  });
});

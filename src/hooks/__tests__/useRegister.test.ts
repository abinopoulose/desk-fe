import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegister } from '../useRegister';
import * as authApi from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../api/authApi', () => ({
  register: vi.fn(),
}));

describe('useRegister hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, privileges: [] });
  });

  it('initializes with default form state', () => {
    const { result } = renderHook(() => useRegister());

    expect(result.current.formState).toEqual({
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('updates form fields with setField', () => {
    const { result } = renderHook(() => useRegister());

    act(() => {
      result.current.setField('email', 'new@example.com');
      result.current.setField('fullName', 'New User');
      result.current.setField('password', 'password123');
      result.current.setField('confirmPassword', 'password123');
    });

    expect(result.current.formState).toEqual({
      email: 'new@example.com',
      fullName: 'New User',
      password: 'password123',
      confirmPassword: 'password123',
    });
  });

  it('validates empty fields', async () => {
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      const res = await result.current.submit();
      expect(res).toBe(false);
    });

    expect(result.current.error).toBe('Please fill in all fields');
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('validates password mismatch', async () => {
    const { result } = renderHook(() => useRegister());

    act(() => {
      result.current.setField('email', 'test@example.com');
      result.current.setField('fullName', 'Test User');
      result.current.setField('password', 'password123');
      result.current.setField('confirmPassword', 'different');
    });

    await act(async () => {
      const res = await result.current.submit();
      expect(res).toBe(false);
    });

    expect(result.current.error).toBe('Passwords do not match');
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('validates password minimum length', async () => {
    const { result } = renderHook(() => useRegister());

    act(() => {
      result.current.setField('email', 'test@example.com');
      result.current.setField('fullName', 'Test User');
      result.current.setField('password', 'short');
      result.current.setField('confirmPassword', 'short');
    });

    await act(async () => {
      const res = await result.current.submit();
      expect(res).toBe(false);
    });

    expect(result.current.error).toBe('Password must be at least 8 characters');
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('successfully registers and logs in when token returned', async () => {
    const mockUser = { id: '1', email: 'test@example.com', fullName: 'Test User', roles: ['USER'] };
    vi.mocked(authApi.register).mockResolvedValueOnce({
      token: 'test-token',
      user: mockUser,
    });

    const { result } = renderHook(() => useRegister());

    act(() => {
      result.current.setField('email', 'test@example.com');
      result.current.setField('fullName', 'Test User');
      result.current.setField('password', 'password123');
      result.current.setField('confirmPassword', 'password123');
    });

    await act(async () => {
      const res = await result.current.submit();
      expect(res).toBe(true);
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('test-token');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

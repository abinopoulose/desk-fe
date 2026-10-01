import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../../store/authStore';
import * as authApi from '../../api/authApi';

vi.mock('../../api/authApi', () => ({
  login: vi.fn(),
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, privileges: [] });
  });

  it('initializes with default auth state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.data.user).toBeNull();
    expect(result.current.data.token).toBeNull();
    expect(result.current.data.isAuthenticated).toBe(false);
    expect(result.current.data.privileges).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('performs login successfully', async () => {
    const mockUser = { id: '1', email: 'user@example.com', fullName: 'User', roles: ['TICKET_READ'] };
    const mockResponse = {
      token: 'jwt-token',
      user: mockUser,
    };
    vi.mocked(authApi.login).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const res = await result.current.login({ email: 'user@example.com', password: 'password123' });
      expect(res).toEqual(mockResponse);
    });

    expect(result.current.data.isAuthenticated).toBe(true);
    expect(result.current.data.token).toBe('jwt-token');
    expect(result.current.data.user).toEqual(mockUser);
    expect(result.current.hasPrivilege('TICKET_READ')).toBe(true);
    expect(result.current.hasPrivilege('ADMIN')).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles login failure', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login({ email: 'bad@example.com', password: 'bad' });
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.data.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.loading).toBe(false);
  });


  it('handles logout and initialize', () => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(result.current.data.isAuthenticated).toBe(false);
    expect(result.current.data.user).toBeNull();

    act(() => {
      result.current.initialize();
    });
    expect(result.current.data.isAuthenticated).toBe(false);
  });

  it('grants all privileges to SUPER_ADMIN', () => {
    useAuthStore.setState({
      user: { id: 'admin-id', email: 'admin@test.com', fullName: 'Super Admin', roles: ['SUPER_ADMIN'] },
      isAuthenticated: true,
      privileges: ['SUPER_ADMIN']
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasPrivilege('TICKET_TYPE_WRITE')).toBe(true);
    expect(result.current.hasPrivilege('DEPARTMENT_WRITE')).toBe(true);
    expect(result.current.hasPrivilege('ROLE_WRITE')).toBe(true);
    expect(result.current.hasPrivilege('SLA_WRITE')).toBe(true);
    expect(result.current.hasPrivilege('TENANT_MANAGE')).toBe(true);
    expect(result.current.hasPrivilege('ANY_ARBITRARY_PRIVILEGE')).toBe(true);
  });
});

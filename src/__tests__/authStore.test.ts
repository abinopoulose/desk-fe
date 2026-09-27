import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, privileges: [] });
  });

  it('handles login and logout', () => {
    const user = { id: '1', email: 'test@test.com', fullName: 'Test User', roles: ['admin'] };
    useAuthStore.getState().login('fake-token', user, ['read', 'write']);

    expect(localStorage.getItem('desk_token')).toBe('fake-token');
    expect(localStorage.getItem('desk_user')).toBe(JSON.stringify(user));
    expect(localStorage.getItem('desk_privileges')).toBe(JSON.stringify(['read', 'write']));

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('fake-token');
    expect(state.user).toEqual(user);
    expect(state.privileges).toEqual(['read', 'write']);

    // Logout
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
    
    useAuthStore.getState().logout();
    expect(localStorage.getItem('desk_token')).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(window.location.href).toBe('/login');
  });

  it('initializes correctly with valid token', () => {
    // Generate valid token
    const validPayload = { exp: Date.now() / 1000 + 3600 };
    const validToken = 'header.' + btoa(JSON.stringify(validPayload)) + '.sig';
    
    localStorage.setItem('desk_token', validToken);
    localStorage.setItem('desk_user', JSON.stringify({ id: '1' }));
    localStorage.setItem('desk_privileges', JSON.stringify(['admin']));

    useAuthStore.getState().initialize();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe(validToken);
    expect(state.user?.id).toBe('1');
    expect(state.privileges).toEqual(['admin']);
  });

  it('initializes failure on expired token', () => {
    // Generate expired token
    const expiredPayload = { exp: Date.now() / 1000 - 3600 };
    const expiredToken = 'header.' + btoa(JSON.stringify(expiredPayload)) + '.sig';
    
    localStorage.setItem('desk_token', expiredToken);
    useAuthStore.getState().initialize();
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('desk_token')).toBeNull();
  });

  it('initializes failure on invalid token structure', () => {
    localStorage.setItem('desk_token', 'invalid-token');
    useAuthStore.getState().initialize();
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
  });
});

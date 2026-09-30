import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tokenStorage } from '../tokenStorage';
import type { UserDTO } from '../../types/auth';

describe('tokenStorage', () => {
  const mockUser: UserDTO = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    roles: ['EMPLOYEE']
  };

  const mockPrivileges = ['USER_READ', 'TICKET_READ'];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('token', () => {
    it('should set and get token', () => {
      tokenStorage.setToken('test-token');
      expect(tokenStorage.getToken()).toBe('test-token');
    });

    it('should return null when token is not set', () => {
      expect(tokenStorage.getToken()).toBeNull();
    });

    it('should remove token', () => {
      tokenStorage.setToken('test-token');
      tokenStorage.removeToken();
      expect(tokenStorage.getToken()).toBeNull();
    });
  });

  describe('user', () => {
    it('should set and get user', () => {
      tokenStorage.setUser(mockUser);
      expect(tokenStorage.getUser()).toEqual(mockUser);
    });

    it('should return null when user is not set', () => {
      expect(tokenStorage.getUser()).toBeNull();
    });

    it('should return null on invalid JSON parsing', () => {
      localStorage.setItem('desk_user', 'invalid-json');
      expect(tokenStorage.getUser()).toBeNull();
    });
  });

  describe('privileges', () => {
    it('should set and get privileges', () => {
      tokenStorage.setPrivileges(mockPrivileges);
      expect(tokenStorage.getPrivileges()).toEqual(mockPrivileges);
    });

    it('should return null when privileges are not set', () => {
      expect(tokenStorage.getPrivileges()).toBeNull();
    });

    it('should return null on invalid JSON parsing', () => {
      localStorage.setItem('desk_privileges', 'invalid-json');
      expect(tokenStorage.getPrivileges()).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all auth data', () => {
      tokenStorage.setToken('test-token');
      tokenStorage.setUser(mockUser);
      tokenStorage.setPrivileges(mockPrivileges);

      tokenStorage.clearAll();

      expect(tokenStorage.getToken()).toBeNull();
      expect(tokenStorage.getUser()).toBeNull();
      expect(tokenStorage.getPrivileges()).toBeNull();
    });
  });
});

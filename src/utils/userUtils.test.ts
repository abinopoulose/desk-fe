import { describe, it, expect } from 'vitest';
import { getUserSlug, getUserInitial } from './userUtils';

describe('userUtils - getUserSlug', () => {
  it('extracts username from email correctly', () => {
    expect(getUserSlug({ email: 'abino@abino.in' })).toBe('abino');
    expect(getUserSlug({ email: 'abino.poulose.123@abino.in' })).toBe('abino.poulose.123');
  });

  it('prefers explicit username if present', () => {
    expect(getUserSlug({ username: 'custom_user', email: 'abino@abino.in' })).toBe('custom_user');
  });

  it('falls back to displayId or id when email is absent', () => {
    expect(getUserSlug({ displayId: 'USER-1', id: 'uuid-123' })).toBe('USER-1');
    expect(getUserSlug({ id: 'uuid-123' })).toBe('uuid-123');
  });

  it('handles null/undefined gracefully', () => {
    expect(getUserSlug(null)).toBe('');
    expect(getUserSlug(undefined)).toBe('');
  });
});

describe('userUtils - getUserInitial', () => {
  it('extracts initial from string name', () => {
    expect(getUserInitial('Abino Poulose')).toBe('A');
    expect(getUserInitial('jane doe')).toBe('J');
  });

  it('extracts initial from user object fullName or email', () => {
    expect(getUserInitial({ fullName: 'Specialist Alice' })).toBe('S');
    expect(getUserInitial({ email: 'bob@example.com' })).toBe('B');
  });

  it('returns custom or default fallback for null/empty', () => {
    expect(getUserInitial(null)).toBe('U');
    expect(getUserInitial(undefined, '?')).toBe('?');
    expect(getUserInitial('', 'X')).toBe('X');
  });
});

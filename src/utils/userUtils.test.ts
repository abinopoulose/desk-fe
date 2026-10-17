import { describe, it, expect } from 'vitest';
import { getUserSlug } from './userUtils';

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

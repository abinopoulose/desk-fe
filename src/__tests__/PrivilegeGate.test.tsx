import { render, screen, cleanup } from '@testing-library/react';
import { PrivilegeGate } from '../components/auth/PrivilegeGate';
import { useAuthStore } from '../store/authStore';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('PrivilegeGate', () => {
  beforeEach(() => {
    useAuthStore.setState({ privileges: [] });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children if no privileges required', () => {
    render(<PrivilegeGate>Content</PrivilegeGate>);
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('renders children if user has required privilege', () => {
    useAuthStore.setState({ privileges: ['admin'] });
    render(<PrivilegeGate requiredPrivilege="admin">Content</PrivilegeGate>);
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('renders fallback if user lacks required privilege', () => {
    useAuthStore.setState({ privileges: ['user'] });
    render(
      <PrivilegeGate requiredPrivilege="admin" fallback={<div>Fallback</div>}>
        Content
      </PrivilegeGate>
    );
    expect(screen.getByText('Fallback')).toBeDefined();
    expect(screen.queryByText('Content')).toBeNull();
  });

  it('handles requireAll=true correctly', () => {
    useAuthStore.setState({ privileges: ['read', 'write'] });
    const props = { requiredPrivileges: ['read', 'write', 'delete'], requireAll: true };
    render(<PrivilegeGate {...props} fallback="Fallback">Content</PrivilegeGate>);
    expect(screen.getByText('Fallback')).toBeDefined();
  });

  it('handles requireAll=false correctly', () => {
    useAuthStore.setState({ privileges: ['read'] });
    const props = { requiredPrivileges: ['read', 'write', 'delete'], requireAll: false };
    render(<PrivilegeGate {...props} fallback="Fallback">Content</PrivilegeGate>);
    expect(screen.getByText('Content')).toBeDefined();
  });
});

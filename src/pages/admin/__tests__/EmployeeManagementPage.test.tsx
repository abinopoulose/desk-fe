import { render, screen, fireEvent } from '@testing-library/react';
import { EmployeeManagementPage } from '../EmployeeManagementPage';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';

const mockHook = {
  users: [{ id: '1', email: 'test@example.com', fullName: 'Test', roles: ['USER'], status: 'ACTIVE' }],
  loading: false,
  error: null,
  inviteError: null,
  isInviteModalOpen: false,
  setIsInviteModalOpen: vi.fn(),
  inviteLoading: false,
  handleInvite: vi.fn(),
  handleResendInvite: vi.fn()
};

vi.mock('../../../hooks/useEmployeeManagement', () => ({
  useEmployeeManagement: () => mockHook
}));

describe('EmployeeManagementPage', () => {
  it('renders users list', () => {
    render(
      <MemoryRouter>
        <EmployeeManagementPage />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Employee Management')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
  });

  it('opens invite modal', () => {
    mockHook.isInviteModalOpen = true;
    render(
      <MemoryRouter>
        <EmployeeManagementPage />
      </MemoryRouter>
    );
    
    expect(screen.getAllByText('Invite Employee').length).toBeGreaterThan(0);
    expect(screen.getByText('Email Address')).toBeDefined();
  });
});

import { render, screen } from '@testing-library/react';
import { SetPasswordPage } from '../pages/auth/SetPasswordPage';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../hooks/useSetPassword', () => ({
  useSetPassword: () => ({
    formState: { password: '', confirmPassword: '' },
    setField: vi.fn(),
    submit: vi.fn((e) => e.preventDefault()),
    loading: false,
    error: null,
    token: 'valid-token'
  })
}));

describe('SetPasswordPage', () => {
  it('renders the set password form correctly', () => {
    render(
      <MemoryRouter>
        <SetPasswordPage />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Set Your Password/i)).toBeDefined();
    expect(screen.getByLabelText(/^New Password/i)).toBeDefined();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeDefined();
  });
});

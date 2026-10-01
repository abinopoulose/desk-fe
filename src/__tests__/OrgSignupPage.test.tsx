import { render, screen } from '@testing-library/react';
import { OrgSignupPage } from '../pages/auth/OrgSignupPage';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../hooks/useOrgSignup', () => ({
  useOrgSignup: () => ({
    formState: { name: '', adminFullName: '', adminEmail: '', password: '', confirmPassword: '' },
    setField: vi.fn(),
    submit: vi.fn((e) => e.preventDefault()),
    loading: false,
    error: null
  })
}));

describe('OrgSignupPage', () => {
  it('renders the signup form correctly', () => {
    render(
      <MemoryRouter>
        <OrgSignupPage />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Create your Organization/i)).toBeDefined();
    expect(screen.getByLabelText(/Organization Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Admin Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Admin Email address/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password/i)).toBeDefined();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeDefined();
  });
});

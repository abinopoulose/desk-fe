import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { OrgSignupPage } from './OrgSignupPage';
import * as hooks from '../../hooks';

vi.mock('../../hooks', () => ({
  useOrgSignup: vi.fn(),
}));

describe('OrgSignupPage', () => {
  const mockSetField = vi.fn();
  const mockSubmit = vi.fn((e) => e.preventDefault());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooks.useOrgSignup).mockReturnValue({
      formState: {
        name: '',
        adminFullName: '',
        adminEmail: '',
        password: '',
        confirmPassword: '',
      },
      setField: mockSetField,
      submit: mockSubmit,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Register your Organization form inputs and labels with dark mode layout', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<OrgSignupPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Register your Organization')).toBeDefined();
    expect(screen.getByText('Create an account to start managing your workspace')).toBeDefined();

    expect(screen.getByLabelText(/Organization Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Admin Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Admin Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password/i)).toBeDefined();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeDefined();

    expect(screen.getByRole('button', { name: /Create Organization/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Sign in/i })).toBeDefined();
  });

  it('handles field changes and submission', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<OrgSignupPage />} />
        </Routes>
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/Organization Name/i);
    fireEvent.change(nameInput, { target: { value: 'Acme Corp' } });
    expect(mockSetField).toHaveBeenCalledWith('name', 'Acme Corp');

    const submitBtn = screen.getByRole('button', { name: /Create Organization/i });
    fireEvent.click(submitBtn);
    expect(mockSubmit).toHaveBeenCalled();
  });

  it('renders error alert when error is present', () => {
    vi.mocked(hooks.useOrgSignup).mockReturnValue({
      formState: {
        name: '',
        adminFullName: '',
        adminEmail: '',
        password: '',
        confirmPassword: '',
      },
      setField: mockSetField,
      submit: mockSubmit,
      loading: false,
      error: 'Organization already exists',
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<OrgSignupPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Organization already exists')).toBeDefined();
  });
});

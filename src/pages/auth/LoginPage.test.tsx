import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import * as hooks from '../../hooks';
import * as orgApi from '../../api/organizationApi';
import { APP_NAME } from '../../constants';

vi.mock('../../hooks', () => ({
  useLogin: vi.fn(),
}));

vi.mock('../../api/organizationApi', () => ({
  resolveOrganization: vi.fn(),
}));

vi.mock('react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('LoginPage', () => {
  const originalLocation = window.location;
  const mockSetField = vi.fn();
  const mockSubmit = vi.fn();

  const mockLocation = (loc: Partial<Location>) => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        protocol: 'http:',
        pathname: '/',
        search: '',
        hash: '',
        port: '',
        ...loc,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation({ hostname: 'localhost' });
    vi.mocked(hooks.useLogin).mockReturnValue({
      formState: { email: '', password: '' },
      setField: mockSetField,
      submit: mockSubmit,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('renders simplified login page with application name and form inputs', () => {
    render(<LoginPage />);

    // Title should contain APP_NAME
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain(`Sign in to ${APP_NAME}`);

    // Work email input
    const emailInput = screen.getByPlaceholderText('name@company.com');
    expect(emailInput).toBeDefined();

    // Password input
    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    expect(passwordInput).toBeDefined();

    // Forgot password link
    expect(screen.getByText(/forgot password\?/i)).toBeDefined();

    // Submit button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();

    // Register organization link for root domain
    expect(screen.getByText(/register organization/i)).toBeDefined();
  });

  it('updates form fields on change and submits form', () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('name@company.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(mockSetField).toHaveBeenCalledWith('email', 'test@example.com');

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    expect(mockSetField).toHaveBeenCalledWith('password', 'Secret123!');

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);
    expect(mockSubmit).toHaveBeenCalled();
  });

  it('toggles password visibility', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText('••••••••••••') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /toggle password visibility/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('displays error alert when login fails', () => {
    vi.mocked(hooks.useLogin).mockReturnValue({
      formState: { email: 'bad@example.com', password: 'wrong' },
      setField: mockSetField,
      submit: mockSubmit,
      loading: false,
      error: 'Invalid credentials. Please check your email and password.',
    });

    render(<LoginPage />);

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeDefined();
    expect(errorAlert.textContent).toContain('Invalid credentials. Please check your email and password.');
  });

  it('displays tenant workspace information when accessed via tenant subdomain', async () => {
    mockLocation({ hostname: 'acme.localhost' });
    vi.mocked(orgApi.resolveOrganization).mockResolvedValue({
      data: {
        id: 'org-1',
        name: 'Acme Corporation',
        domain: 'acme.com',
        slug: 'acme',
        createdAt: '2026-01-01T00:00:00Z',
      } as any,
    } as any);

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText(/workspace:/i)).toBeDefined();
      expect(screen.getAllByText(/acme corporation/i).length).toBeGreaterThan(0);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toContain('Welcome to Acme Corporation');
    });

    // On tenant subdomain, register new organization should not be shown
    expect(screen.queryByText(/register organization/i)).toBeNull();
  });
});

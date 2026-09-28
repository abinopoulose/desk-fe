import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { RegisterPage } from '../pages/auth/RegisterPage';
import * as authApi from '../api/authApi';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../api/authApi', () => ({
  register: vi.fn(),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

  it('renders register form correctly', () => {
    renderComponent();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Already have an account\? Sign in/i })).toBeInTheDocument();
  });

  it('shows error when fields are empty', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    expect(await screen.findByText('Please fill in all fields')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password1234' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('handles successful registration with token', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({
      token: 'test-token',
      user: { id: '1', email: 'test@example.com', fullName: 'Test User', roles: [] },
    });

    renderComponent();
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => {
      expect(localStorage.getItem('desk_token')).toBe('test-token');
    });
  });

  it('handles failed registration due to domain', async () => {
    const error = Object.assign(new Error(), {
      isAxiosError: true,
      name: 'AxiosError',
      response: {
        status: 403,
        data: { message: 'Forbidden' }
      }
    });

    vi.mocked(authApi.register).mockRejectedValueOnce(error);

    renderComponent();
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(await screen.findByText('An unexpected error occurred')).toBeInTheDocument();
  });
});

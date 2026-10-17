import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import * as sessionApi from '../../api/sessionApi';

describe('ForgotPasswordPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders request password reset form', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Reset Password')).toBeDefined();
    expect(screen.getByPlaceholderText('name@company.com')).toBeDefined();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeDefined();
  });

  it('submits email and displays confirmation message', async () => {
    const forgotMock = vi.spyOn(sessionApi, 'requestForgotPassword').mockResolvedValue({
      message: 'Reset link sent',
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('name@company.com');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(forgotMock).toHaveBeenCalledWith('user@example.com');
      expect(
        screen.getByText(/If an account is associated with/i)
      ).toBeDefined();
      expect(screen.getByText('Return to Sign In')).toBeDefined();
    });
  });
});

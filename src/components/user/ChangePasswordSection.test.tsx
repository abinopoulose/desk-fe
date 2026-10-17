import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ChangePasswordSection } from './ChangePasswordSection';
import * as sessionApi from '../../api/sessionApi';

describe('ChangePasswordSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders change password form with terminate other sessions option', () => {
    render(<ChangePasswordSection otherSessionsCount={2} />);

    expect(screen.getByText('Change Password')).toBeDefined();
    expect(screen.getByText('Terminate all other logged in sessions')).toBeDefined();
    expect(
      screen.getByText(/You currently have 2 other active session\(s\) that will be terminated\./)
    ).toBeDefined();
  });

  it('validates password matching and length', async () => {
    render(<ChangePasswordSection />);

    const inputs = screen.getAllByPlaceholderText('••••••••••••');
    const currentInput = inputs[0];
    const newInput = inputs[1];
    const confirmInput = inputs[2];

    fireEvent.change(currentInput, { target: { value: 'oldPassword123' } });
    fireEvent.change(newInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'mismatch' } });

    const submitBtn = screen.getByRole('button', { name: 'Update Password' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('New password must be at least 8 characters long')).toBeDefined();
    });
  });

  it('submits password change with terminateOtherSessions flag', async () => {
    const changeMock = vi.spyOn(sessionApi, 'changePassword').mockResolvedValue({
      message: 'Password updated successfully',
    });

    render(<ChangePasswordSection otherSessionsCount={1} />);

    const inputs = screen.getAllByPlaceholderText('••••••••••••');
    fireEvent.change(inputs[0], { target: { value: 'oldPassword123' } });
    fireEvent.change(inputs[1], { target: { value: 'newPassword123' } });
    fireEvent.change(inputs[2], { target: { value: 'newPassword123' } });

    const submitBtn = screen.getByRole('button', { name: 'Update Password' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(changeMock).toHaveBeenCalledWith({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
        terminateOtherSessions: true,
      });
      expect(
        screen.getByText(
          'Password updated successfully and all other sessions have been terminated.'
        )
      ).toBeDefined();
    });
  });
});

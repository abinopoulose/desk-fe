import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ActiveSessionsSection } from './ActiveSessionsSection';
import * as sessionApi from '../../api/sessionApi';
import type { UserSession } from '../../types/session';

describe('ActiveSessionsSection Component', () => {
  const mockSessions: UserSession[] = [
    {
      id: 'sess-1',
      ipAddress: '127.0.0.1',
      deviceInfo: 'Chrome on macOS',
      location: 'Local Network',
      createdAt: '2026-10-17T10:00:00Z',
      lastActiveAt: '2026-10-17T11:00:00Z',
      expiresAt: '2026-10-18T10:00:00Z',
      isActive: true,
      isCurrent: true,
    },
    {
      id: 'sess-2',
      ipAddress: '192.168.1.50',
      deviceInfo: 'Safari on iPhone',
      location: 'Local Network',
      createdAt: '2026-10-17T09:00:00Z',
      lastActiveAt: '2026-10-17T09:30:00Z',
      expiresAt: '2026-10-18T09:00:00Z',
      isActive: true,
      isCurrent: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders active sessions with current session badge', async () => {
    vi.spyOn(sessionApi, 'getActiveSessions').mockResolvedValue(mockSessions);

    render(<ActiveSessionsSection />);

    await waitFor(() => {
      expect(screen.getByText('Chrome on macOS')).toBeDefined();
      expect(screen.getByText('Safari on iPhone')).toBeDefined();
    });

    expect(screen.getByText('This Device (Current Session)')).toBeDefined();
    expect(screen.getByText('127.0.0.1')).toBeDefined();
    expect(screen.getByText('192.168.1.50')).toBeDefined();
    expect(screen.getByText('Terminate All Other Sessions (1)')).toBeDefined();
  });

  it('allows terminating a single session', async () => {
    vi.spyOn(sessionApi, 'getActiveSessions').mockResolvedValue(mockSessions);
    const terminateMock = vi.spyOn(sessionApi, 'terminateSession').mockResolvedValue();

    render(<ActiveSessionsSection />);

    await waitFor(() => {
      expect(screen.getByText('Safari on iPhone')).toBeDefined();
    });

    const terminateButtons = screen.getAllByRole('button', { name: /terminate/i });
    const rowTerminateBtn = terminateButtons.find((btn) => btn.textContent?.trim() === 'Terminate');
    expect(rowTerminateBtn).toBeDefined();

    fireEvent.click(rowTerminateBtn!);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Terminate Session' })).toBeDefined();
    });

    const confirmBtn = screen.getByRole('button', { name: 'Terminate Session' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(terminateMock).toHaveBeenCalledWith('sess-2');
    });
  });

  it('allows terminating all other sessions', async () => {
    vi.spyOn(sessionApi, 'getActiveSessions').mockResolvedValue(mockSessions);
    const terminateOthersMock = vi.spyOn(sessionApi, 'terminateOtherSessions').mockResolvedValue({
      message: '1 session terminated',
      count: 1,
    });

    render(<ActiveSessionsSection />);

    await waitFor(() => {
      expect(screen.getByText('Terminate All Other Sessions (1)')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Terminate All Other Sessions (1)'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Terminate All Other Sessions' })).toBeDefined();
    });

    const confirmBtn = screen.getByRole('button', { name: 'Terminate All Other Sessions' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(terminateOthersMock).toHaveBeenCalledTimes(1);
    });
  });
});

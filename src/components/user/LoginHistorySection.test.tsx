import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { LoginHistorySection } from './LoginHistorySection';
import * as sessionApi from '../../api/sessionApi';
import type { UserSession } from '../../types/session';

describe('LoginHistorySection Component', () => {
  const mockHistory: UserSession[] = [
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
      ipAddress: '10.0.0.15',
      deviceInfo: 'Firefox on Windows',
      location: 'Local Network',
      createdAt: '2026-10-16T14:00:00Z',
      lastActiveAt: '2026-10-16T15:00:00Z',
      expiresAt: '2026-10-17T14:00:00Z',
      isActive: false,
      terminatedAt: '2026-10-16T15:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders login history records with correct status badges', async () => {
    vi.spyOn(sessionApi, 'getLoginHistory').mockResolvedValue(mockHistory);

    render(<LoginHistorySection />);

    await waitFor(() => {
      expect(screen.getByText('Chrome on macOS')).toBeDefined();
      expect(screen.getByText('Firefox on Windows')).toBeDefined();
    });

    expect(screen.getByText('Active')).toBeDefined();
    expect(screen.getByText('Terminated')).toBeDefined();
    expect(screen.getByText('127.0.0.1')).toBeDefined();
    expect(screen.getByText('10.0.0.15')).toBeDefined();
    expect(screen.getByText('2 Records')).toBeDefined();
  });
});

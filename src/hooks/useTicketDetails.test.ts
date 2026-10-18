import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTicketDetails } from './useTicketDetails';
import { ticketApi } from '../api/ticketApi';
import type { TicketDetailResponse } from '../types/ticket';

vi.mock('../api/ticketApi', () => ({
  ticketApi: {
    getTicketDetails: vi.fn(),
    updateTicketStatus: vi.fn(),
    assignTicket: vi.fn(),
  },
}));

describe('useTicketDetails hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets isForbidden: true and statusCode: 403 when getTicketDetails throws a 403 error', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockRejectedValue({
      message: 'You do not have permission to view this ticket',
      statusCode: 403,
    });

    const { result } = renderHook(() => useTicketDetails('TECH-2'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isForbidden).toBe(true);
    expect(result.current.statusCode).toBe(403);
    expect(result.current.error).toBe('You do not have permission to view this ticket');
    expect(result.current.ticket).toBeNull();
  });

  it('sets ticket data and isForbidden: false on successful load', async () => {
    const mockTicket: TicketDetailResponse = {
      id: 'ticket-123',
      displayId: 'TECH-2',
      title: 'VPN Connection Problem',
      ticketType: {
        id: 'tt-1',
        title: 'Network Issue',
        department: { id: 'd-1', name: 'IT Infrastructure' },
      },
      currentStatus: {
        id: 'status-open',
        name: 'Open',
        mappedState: 'OPEN',
      },
      priority: 2,
      formData: {},
      createdAt: '2026-10-18T10:00:00Z',
      updatedAt: '2026-10-18T10:00:00Z',
    };

    vi.mocked(ticketApi.getTicketDetails).mockResolvedValue(mockTicket);

    const { result } = renderHook(() => useTicketDetails('TECH-2'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isForbidden).toBe(false);
    expect(result.current.statusCode).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.ticket).toEqual(mockTicket);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTicketDetails } from '../useTicketDetails';
import { ticketApi } from '../../api/ticketApi';
import type { TicketDetailResponse } from '../../types/ticket';

vi.mock('../../api/ticketApi', () => ({
  ticketApi: {
    getTicketDetails: vi.fn(),
    updateTicketStatus: vi.fn(),
    assignTicket: vi.fn(),
  },
}));

const mockTicket: TicketDetailResponse = {
  id: 'ticket-1',
  ticketType: { id: 'type-1', title: 'Hardware Request' },
  requester: { id: 'req-1', fullName: 'John Doe', email: 'john@example.com' },
  assignee: { id: 'agent-1', fullName: 'Agent Smith', email: 'agent@example.com' },
  currentStatus: { id: 'status-open', name: 'Open', mappedState: 'OPEN' },
  priority: 1,
  formData: { device: 'Laptop' },
  slaDueAt: '2026-10-01T00:00:00Z',
  slaBreached: false,
  comments: [],
  history: [],
  createdAt: '2026-09-29T00:00:00Z',
  updatedAt: '2026-09-29T00:00:00Z',
};

describe('useTicketDetails hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state when no ticketId is provided', () => {
    const { result } = renderHook(() => useTicketDetails());
    expect(result.current.ticket).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches ticket details on mount when ticketId is provided', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(mockTicket);

    const { result } = renderHook(() => useTicketDetails('ticket-1'));
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ticket).toEqual(mockTicket);
    expect(result.current.error).toBeNull();
    expect(ticketApi.getTicketDetails).toHaveBeenCalledWith('ticket-1');
  });

  it('handles error when fetchTicketById fails', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockRejectedValueOnce(new Error('Ticket not found'));

    const { result } = renderHook(() => useTicketDetails('ticket-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ticket).toBeNull();
    expect(result.current.error).toBe('Ticket not found');
  });

  it('refetches ticket data when refetch is called', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(mockTicket);

    const { result } = renderHook(() => useTicketDetails('ticket-1'));

    await waitFor(() => {
      expect(result.current.ticket).toEqual(mockTicket);
    });

    const updatedTicket: TicketDetailResponse = {
      ...mockTicket,
      priority: 2,
    };
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(updatedTicket);

    await act(async () => {
      const data = await result.current.refetch();
      expect(data).toEqual(updatedTicket);
    });

    expect(result.current.ticket).toEqual(updatedTicket);
  });

  it('updates ticket status optimistically and syncs with API', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(mockTicket);

    const { result } = renderHook(() => useTicketDetails('ticket-1'));

    await waitFor(() => {
      expect(result.current.ticket).toEqual(mockTicket);
    });

    const closedTicket: TicketDetailResponse = {
      ...mockTicket,
      currentStatus: { id: 'status-closed', name: 'Closed', mappedState: 'CLOSED' },
    };
    vi.mocked(ticketApi.updateTicketStatus).mockResolvedValueOnce({} as never);
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(closedTicket);

    await act(async () => {
      const updated = await result.current.updateStatus('status-closed');
      expect(updated).toEqual(closedTicket);
    });

    expect(ticketApi.updateTicketStatus).toHaveBeenCalledWith('ticket-1', 'status-closed');
    expect(result.current.ticket?.currentStatus.mappedState).toBe('CLOSED');
  });

  it('rolls back status update when API call fails', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(mockTicket);

    const { result } = renderHook(() => useTicketDetails('ticket-1'));

    await waitFor(() => {
      expect(result.current.ticket).toEqual(mockTicket);
    });

    vi.mocked(ticketApi.updateTicketStatus).mockRejectedValueOnce(new Error('Update failed'));

    await act(async () => {
      try {
        await result.current.updateStatus('status-closed');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.ticket).toEqual(mockTicket);
    expect(result.current.error).toBe('Update failed');
  });

  it('assigns ticket and updates state', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(mockTicket);

    const { result } = renderHook(() => useTicketDetails('ticket-1'));

    await waitFor(() => {
      expect(result.current.ticket).toEqual(mockTicket);
    });

    const reassignedTicket: TicketDetailResponse = {
      ...mockTicket,
      assignee: undefined,
    };
    vi.mocked(ticketApi.assignTicket).mockResolvedValueOnce({} as never);
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(reassignedTicket);

    await act(async () => {
      const updated = await result.current.assignTicket(null);
      expect(updated).toEqual(reassignedTicket);
    });

    expect(ticketApi.assignTicket).toHaveBeenCalledWith('ticket-1', null);
    expect(result.current.ticket?.assignee).toBeUndefined();
  });

  it('rolls back assignee change when assignment fails', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(mockTicket);

    const { result } = renderHook(() => useTicketDetails('ticket-1'));

    await waitFor(() => {
      expect(result.current.ticket).toEqual(mockTicket);
    });

    vi.mocked(ticketApi.assignTicket).mockRejectedValueOnce(new Error('Assignment failed'));

    await act(async () => {
      try {
        await result.current.assignTicket(null);
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.ticket).toEqual(mockTicket);
    expect(result.current.error).toBe('Assignment failed');
  });

  it('allows manual updateTicket mutation', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(mockTicket);

    const { result } = renderHook(() => useTicketDetails('ticket-1'));

    await waitFor(() => {
      expect(result.current.ticket).toEqual(mockTicket);
    });

    await act(async () => {
      await result.current.updateTicket({ priority: 3 });
    });

    expect(result.current.ticket?.priority).toBe(3);

    await act(async () => {
      await result.current.updateTicket((prev) => (prev ? { ...prev, priority: 4 } : null));
    });

    expect(result.current.ticket?.priority).toBe(4);
  });

  it('clears state when fetchTicketById is called with no id and no ticketId', async () => {
    const { result } = renderHook(() => useTicketDetails());

    await act(async () => {
      const res = await result.current.fetchTicketById();
      expect(res).toBeNull();
    });

    expect(result.current.ticket).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

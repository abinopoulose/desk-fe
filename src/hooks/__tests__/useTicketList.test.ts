import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useTicketList } from '../useTicketList';
import { ticketApi } from '../../api/ticketApi';
import { useAuth } from '../../store/authStore';
import type { TicketDTO, TicketListResponse } from '../../types/ticket';

vi.mock('../../api/ticketApi', () => ({
  ticketApi: {
    getTickets: vi.fn(),
  },
}));

vi.mock('../../store/authStore', () => ({
  useAuth: vi.fn(),
}));

const mockTicket: TicketDTO = {
  id: 'ticket-1',
  ticketTypeId: 'type-1',
  ticketTypeTitle: 'Hardware Request',
  requesterId: 'user-1',
  requesterName: 'John Doe',
  currentStatusId: 'status-1',
  currentStatusName: 'Open',
  mappedState: 'OPEN',
  priority: 1,
  formData: {},
  slaDueAt: '2026-10-01T00:00:00Z',
  slaBreached: false,
  createdAt: '2026-09-29T00:00:00Z',
  updatedAt: '2026-09-29T00:00:00Z',
};

const mockListResponse: TicketListResponse = {
  tickets: [mockTicket],
  totalElements: 1,
  totalPages: 1,
  currentPage: 0,
};

describe('useTicketList hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com', fullName: 'User', roles: ['USER'] },
      hasPrivilege: vi.fn().mockReturnValue(true),
      isAuthenticated: true,
    });
    vi.mocked(ticketApi.getTickets).mockResolvedValue(mockListResponse);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('fetches tickets on mount with default filters', async () => {
    const { result } = renderHook(() => useTicketList());

    await waitFor(() => {
      expect(result.current.tickets).toEqual([mockTicket]);
    });

    expect(ticketApi.getTickets).toHaveBeenCalledWith({
      tab: 'my',
      page: 0,
      size: 20,
      sort: 'createdAt,desc',
      requesterId: 'user-1',
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('updates filters and resets page to 0', async () => {
    const { result } = renderHook(() => useTicketList());

    await waitFor(() => {
      expect(result.current.tickets).toEqual([mockTicket]);
    });

    act(() => {
      result.current.setFilter('tab', 'assigned');
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          tab: 'assigned',
          assigneeId: 'user-1',
          page: 0,
        })
      );
    });

    act(() => {
      result.current.setFilter('status', 'status-open');
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'status-open',
        })
      );
    });

    act(() => {
      result.current.setFilter('mappedState', 'OPEN');
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          mappedState: 'OPEN',
        })
      );
    });

    act(() => {
      result.current.setFilter('priority', '2');
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 2,
        })
      );
    });
  });

  it('debounces search queries', async () => {
    const { result } = renderHook(() => useTicketList());

    await waitFor(() => {
      expect(result.current.tickets).toEqual([mockTicket]);
    });

    act(() => {
      result.current.setFilter('search', 'Laptop');
    });

    expect(result.current.filters.search).toBe('Laptop');

    await waitFor(
      () => {
        expect(ticketApi.getTickets).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Laptop',
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it('handles sort changes via handleSort and setSort', async () => {
    const { result } = renderHook(() => useTicketList());

    await waitFor(() => {
      expect(result.current.tickets).toEqual([mockTicket]);
    });

    act(() => {
      result.current.handleSort('priority');
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'priority,asc',
        })
      );
    });

    act(() => {
      result.current.handleSort('priority');
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'priority,desc',
        })
      );
    });

    act(() => {
      result.current.setSort('createdAt,asc');
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'createdAt,asc',
        })
      );
    });
  });

  it('handles pagination next and prev pages', async () => {
    vi.mocked(ticketApi.getTickets).mockResolvedValue({
      tickets: [mockTicket],
      totalElements: 40,
      totalPages: 2,
      currentPage: 0,
    });

    const { result } = renderHook(() => useTicketList());

    await waitFor(() => {
      expect(result.current.pagination.totalPages).toBe(2);
    });

    act(() => {
      result.current.pagination.nextPage();
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });

    act(() => {
      result.current.pagination.prevPage();
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 0,
        })
      );
    });

    act(() => {
      result.current.pagination.setSize(50);
    });

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 50,
          page: 0,
        })
      );
    });
  });

  it('supports refetch function', async () => {
    const { result } = renderHook(() => useTicketList());

    await waitFor(() => {
      expect(result.current.tickets).toEqual([mockTicket]);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(ticketApi.getTickets).toHaveBeenCalledTimes(2);
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(ticketApi.getTickets).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTicketList());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTicketStatuses } from '../useTicketStatuses';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import type { TicketStatusDTO } from '../../types/ticket';

vi.mock('../../api/ticketTypeApi', () => ({
  ticketTypeApi: {
    getTicketStatuses: vi.fn(),
    createTicketStatus: vi.fn(),
    updateTicketStatus: vi.fn(),
    deleteTicketStatus: vi.fn(),
  },
}));

describe('useTicketStatuses hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches statuses successfully', async () => {
    const mockStatuses: TicketStatusDTO[] = [
      { id: 's1', name: 'Open', mappedState: 'OPEN', displayOrder: 1 },
    ];
    vi.mocked(ticketTypeApi.getTicketStatuses).mockResolvedValueOnce(mockStatuses);

    const { result } = renderHook(() => useTicketStatuses());

    await act(async () => {
      const res = await result.current.fetchStatuses('t1');
      expect(res).toEqual(mockStatuses);
    });

    expect(result.current.data).toEqual(mockStatuses);
    expect(result.current.loading).toBe(false);
  });

  it('handles create, update, and delete status', async () => {
    const mockStatus: TicketStatusDTO = {
      id: 's1',
      name: 'Open',
      mappedState: 'OPEN',
      displayOrder: 1,
    };
    vi.mocked(ticketTypeApi.createTicketStatus).mockResolvedValueOnce(mockStatus);
    vi.mocked(ticketTypeApi.updateTicketStatus).mockResolvedValueOnce(mockStatus);
    vi.mocked(ticketTypeApi.deleteTicketStatus).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTicketStatuses());

    await act(async () => {
      const created = await result.current.createStatus('t1', {
        name: 'Open',
        mappedState: 'OPEN',
        displayOrder: 1,
      });
      expect(created).toEqual(mockStatus);

      const updated = await result.current.updateStatus('s1', {
        name: 'Closed',
        mappedState: 'CLOSED',
        displayOrder: 2,
      });
      expect(updated).toEqual(mockStatus);

      await result.current.deleteStatus('s1');
    });

    expect(ticketTypeApi.deleteTicketStatus).toHaveBeenCalledWith('s1');
  });

  it('handles fetch failure', async () => {
    vi.mocked(ticketTypeApi.getTicketStatuses).mockRejectedValueOnce(new Error('Failed statuses'));

    const { result } = renderHook(() => useTicketStatuses());

    await act(async () => {
      try {
        await result.current.fetchStatuses('t1');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Failed statuses');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTicketTypes } from '../useTicketTypes';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import type { TicketTypeSummaryDTO, TicketTypeDTO } from '../../types/ticket';

vi.mock('../../api/ticketTypeApi', () => ({
  ticketTypeApi: {
    getTicketTypes: vi.fn(),
    getTicketTypeById: vi.fn(),
    createTicketType: vi.fn(),
    updateTicketType: vi.fn(),
    deleteTicketType: vi.fn(),
  },
}));

describe('useTicketTypes hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches ticket types and manages loading/error state', async () => {
    const mockTypes: TicketTypeSummaryDTO[] = [
      { id: '1', title: 'Bug', isActive: true, departmentId: 'd1', folderPath: '/general' },
    ];
    vi.mocked(ticketTypeApi.getTicketTypes).mockResolvedValueOnce(mockTypes);

    const { result } = renderHook(() => useTicketTypes());

    await act(async () => {
      const res = await result.current.fetchTicketTypes(true);
      expect(res).toEqual(mockTypes);
    });

    expect(result.current.data).toEqual(mockTypes);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles error on fetch', async () => {
    vi.mocked(ticketTypeApi.getTicketTypes).mockRejectedValueOnce(new Error('Failed types'));

    const { result } = renderHook(() => useTicketTypes());

    await act(async () => {
      try {
        await result.current.fetchTicketTypes();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Failed types');
  });

  it('handles get, create, update, and delete', async () => {
    const mockDetail: TicketTypeDTO = {
      id: '1',
      title: 'Bug',
      isActive: true,
      departmentId: 'd1',
      folderId: 'f1',
      formSchema: {},
    };
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValueOnce(mockDetail);
    vi.mocked(ticketTypeApi.createTicketType).mockResolvedValueOnce(mockDetail);
    vi.mocked(ticketTypeApi.updateTicketType).mockResolvedValueOnce(mockDetail);
    vi.mocked(ticketTypeApi.deleteTicketType).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTicketTypes());

    await act(async () => {
      const item = await result.current.getTicketType('1');
      expect(item).toEqual(mockDetail);

      const created = await result.current.createTicketType({
        title: 'Bug',
        departmentId: 'd1',
        folderId: 'f1',
        formSchema: {},
      });
      expect(created).toEqual(mockDetail);

      const updated = await result.current.updateTicketType('1', {
        title: 'Bug Updated',
        departmentId: 'd1',
        folderId: 'f1',
        formSchema: {},
      });
      expect(updated).toEqual(mockDetail);

      await result.current.deleteTicketType('1');
    });

    expect(ticketTypeApi.deleteTicketType).toHaveBeenCalledWith('1');
  });
});

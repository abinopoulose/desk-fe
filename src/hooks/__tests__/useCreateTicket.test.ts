import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateTicket } from '../useCreateTicket';
import { ticketApi } from '../../api/ticketApi';
import type { FormSchemaResponse, TicketDTO } from '../../types/ticket';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useSearchParams: () => [new URLSearchParams('typeId=type-123')],
  useNavigate: () => mockNavigate,
}));

vi.mock('../../api/ticketApi', () => ({
  ticketApi: {
    getTicketSchema: vi.fn(),
    createTicket: vi.fn(),
  },
}));

describe('useCreateTicket hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches ticket schema on mount', async () => {
    const mockSchema = {
      id: 'type-123',
      title: 'Hardware Request',
      description: 'Request new hardware',
      departmentId: 'IT',
      folderId: 'Hardware',
      formSchema: { fields: [] },
    };
    vi.mocked(ticketApi.getTicketSchema).mockResolvedValueOnce(mockSchema as unknown as FormSchemaResponse);

    const { result } = renderHook(() => useCreateTicket());

    await waitFor(() => {
      expect(result.current.schemaResponse).toEqual(mockSchema);
    });
    expect(result.current.loadingSchema).toBe(false);
  });

  it('handles form submission and confirmation', async () => {
    vi.mocked(ticketApi.getTicketSchema).mockResolvedValueOnce({} as unknown as FormSchemaResponse);
    vi.mocked(ticketApi.createTicket).mockResolvedValueOnce({ id: 'ticket-999' } as unknown as TicketDTO);

    const { result } = renderHook(() => useCreateTicket());

    act(() => {
      result.current.handleFormSubmit({ reason: 'Need laptop' });
    });

    expect(result.current.showConfirmModal).toBe(true);
    expect(result.current.stagedFormData).toEqual({ reason: 'Need laptop' });

    await act(async () => {
      await result.current.confirmSubmission();
    });

    expect(ticketApi.createTicket).toHaveBeenCalledWith({
      ticketTypeId: 'type-123',
      priority: 3,
      formData: { reason: 'Need laptop' },
    });
    expect(mockNavigate).toHaveBeenCalledWith('/tickets/ticket-999');
  });
});

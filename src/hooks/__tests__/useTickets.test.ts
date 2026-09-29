import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTickets } from '../useTickets';
import { ticketApi } from '../../api/ticketApi';
import type {
  TicketDTO,
  TicketListResponse,
  TicketDetailResponse,
  CommentDTO,
  FormSchemaResponse,
} from '../../types/ticket';

vi.mock('../../api/ticketApi', () => ({
  ticketApi: {
    getTickets: vi.fn(),
    getTicketDetails: vi.fn(),
    createTicket: vi.fn(),
    updateTicketStatus: vi.fn(),
    assignTicket: vi.fn(),
    addComment: vi.fn(),
    getComments: vi.fn(),
    getTicketSchema: vi.fn(),
  },
}));

const mockTicket: TicketDTO = {
  id: '1',
  ticketTypeId: 't1',
  ticketTypeTitle: 'Hardware Request',
  requesterId: 'u1',
  requesterName: 'Requester',
  currentStatusId: 's1',
  currentStatusName: 'Open',
  mappedState: 'OPEN',
  priority: 1,
  formData: {},
  slaDueAt: '2026-10-01T00:00:00Z',
  slaBreached: false,
  createdAt: '2026-09-29T00:00:00Z',
  updatedAt: '2026-09-29T00:00:00Z',
};

const mockList: TicketListResponse = {
  tickets: [mockTicket],
  totalElements: 1,
  totalPages: 1,
  currentPage: 0,
};

const mockComment: CommentDTO = {
  id: 'c1',
  ticketId: '1',
  author: { id: 'u1', fullName: 'Author', email: 'author@example.com' },
  content: 'hello',
  createdAt: '2026-09-29T00:00:00Z',
};

const mockDetails: TicketDetailResponse = {
  id: '1',
  ticketType: { id: 't1', title: 'Hardware Request' },
  requester: { id: 'u1', fullName: 'Requester', email: 'req@example.com' },
  currentStatus: { id: 's1', name: 'Open', mappedState: 'OPEN' },
  priority: 1,
  formData: {},
  slaDueAt: '2026-10-01T00:00:00Z',
  slaBreached: false,
  comments: [mockComment],
  history: [],
  createdAt: '2026-09-29T00:00:00Z',
  updatedAt: '2026-09-29T00:00:00Z',
};

const mockSchema: FormSchemaResponse = {
  id: 's1',
  title: 'Hardware Request',
  description: 'Hardware description',
  departmentId: 'd1',
  folderId: 'f1',
  formSchema: {},
};

describe('useTickets hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useTickets());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches tickets successfully', async () => {
    vi.mocked(ticketApi.getTickets).mockResolvedValueOnce(mockList);

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      const res = await result.current.fetchTickets({ page: 0 });
      expect(res).toEqual(mockList);
    });

    expect(result.current.data).toEqual(mockList);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles fetchTickets failure', async () => {
    vi.mocked(ticketApi.getTickets).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      try {
        await result.current.fetchTickets();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('creates ticket, gets details, updates status, assigns, and adds comment', async () => {
    vi.mocked(ticketApi.createTicket).mockResolvedValueOnce(mockTicket);
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValueOnce(mockDetails);
    vi.mocked(ticketApi.updateTicketStatus).mockResolvedValueOnce(mockTicket);
    vi.mocked(ticketApi.assignTicket).mockResolvedValueOnce(mockTicket);
    vi.mocked(ticketApi.addComment).mockResolvedValueOnce(mockComment);
    vi.mocked(ticketApi.getComments).mockResolvedValueOnce([mockComment]);
    vi.mocked(ticketApi.getTicketSchema).mockResolvedValueOnce(mockSchema);

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      const created = await result.current.createTicket({ ticketTypeId: 't1', priority: 1, formData: {} });
      expect(created).toEqual(mockTicket);

      const details = await result.current.getTicketDetails('1');
      expect(details).toEqual(mockDetails);

      const updated = await result.current.updateTicketStatus('1', 's2');
      expect(updated).toEqual(mockTicket);

      const assigned = await result.current.assignTicket('1', 'u2');
      expect(assigned).toEqual(mockTicket);

      const comment = await result.current.addComment('1', 'hello');
      expect(comment).toEqual(mockComment);

      const comments = await result.current.getComments('1');
      expect(comments).toEqual([mockComment]);

      const schema = await result.current.getTicketSchema('t1');
      expect(schema).toEqual(mockSchema);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTicketComments } from '../useTicketComments';
import { ticketApi } from '../../api/ticketApi';
import type { CommentDTO } from '../../types/ticket';

vi.mock('../../api/ticketApi', () => ({
  ticketApi: {
    addComment: vi.fn(),
    getComments: vi.fn(),
  },
}));

const mockComment: CommentDTO = {
  id: 'c1',
  ticketId: 'ticket-1',
  author: { id: 'u1', fullName: 'John Doe', email: 'john@example.com' },
  content: 'Initial comment',
  createdAt: '2026-09-29T00:00:00Z',
};

describe('useTicketComments hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default empty comments and form state', () => {
    const { result } = renderHook(() => useTicketComments());
    expect(result.current.comments).toEqual([]);
    expect(result.current.commentText).toBe('');
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('initializes with provided initialComments', () => {
    const { result } = renderHook(() =>
      useTicketComments({ ticketId: 'ticket-1', initialComments: [mockComment] })
    );
    expect(result.current.comments).toEqual([mockComment]);
  });

  it('updates comments when initialComments prop changes', () => {
    const { result, rerender } = renderHook(
      ({ initialComments }) => useTicketComments({ ticketId: 'ticket-1', initialComments }),
      { initialProps: { initialComments: [mockComment] } }
    );
    expect(result.current.comments).toEqual([mockComment]);

    const newComment: CommentDTO = {
      id: 'c2',
      ticketId: 'ticket-1',
      author: { id: 'u2', fullName: 'Jane Doe', email: 'jane@example.com' },
      content: 'Second comment',
      createdAt: '2026-09-29T01:00:00Z',
    };

    rerender({ initialComments: [mockComment, newComment] });
    expect(result.current.comments).toEqual([mockComment, newComment]);
  });

  it('updates commentText and resets form', () => {
    const { result } = renderHook(() => useTicketComments({ ticketId: 'ticket-1' }));

    act(() => {
      result.current.setCommentText('Hello world');
    });
    expect(result.current.commentText).toBe('Hello world');

    act(() => {
      result.current.resetForm();
    });
    expect(result.current.commentText).toBe('');
  });

  it('submits a new comment and appends to list', async () => {
    const onCommentAdded = vi.fn();
    const createdComment: CommentDTO = {
      id: 'c-new',
      ticketId: 'ticket-1',
      author: { id: 'u1', fullName: 'John Doe', email: 'john@example.com' },
      content: 'New test comment',
      createdAt: '2026-09-29T02:00:00Z',
    };
    vi.mocked(ticketApi.addComment).mockResolvedValueOnce(createdComment);

    const { result } = renderHook(() =>
      useTicketComments({
        ticketId: 'ticket-1',
        initialComments: [mockComment],
        onCommentAdded,
      })
    );

    act(() => {
      result.current.setCommentText('New test comment');
    });

    await act(async () => {
      const added = await result.current.addTicketComment();
      expect(added).toEqual(createdComment);
    });

    expect(ticketApi.addComment).toHaveBeenCalledWith('ticket-1', 'New test comment');
    expect(result.current.comments).toEqual([mockComment, createdComment]);
    expect(result.current.commentText).toBe('');
    expect(onCommentAdded).toHaveBeenCalledWith(createdComment);
  });

  it('handles submission via handleSubmitComment with event preventDefault', async () => {
    const createdComment: CommentDTO = {
      id: 'c-new',
      ticketId: 'ticket-1',
      author: { id: 'u1', fullName: 'John Doe', email: 'john@example.com' },
      content: 'Event comment',
      createdAt: '2026-09-29T02:00:00Z',
    };
    vi.mocked(ticketApi.addComment).mockResolvedValueOnce(createdComment);

    const { result } = renderHook(() =>
      useTicketComments({
        ticketId: 'ticket-1',
        initialComments: [],
      })
    );

    act(() => {
      result.current.setCommentText('Event comment');
    });

    const preventDefault = vi.fn();
    await act(async () => {
      await result.current.handleSubmitComment({ preventDefault } as unknown as React.FormEvent);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.comments).toEqual([createdComment]);
  });

  it('handles error during comment submission', async () => {
    vi.mocked(ticketApi.addComment).mockRejectedValueOnce(new Error('Failed to post'));

    const { result } = renderHook(() =>
      useTicketComments({
        ticketId: 'ticket-1',
        initialComments: [mockComment],
      })
    );

    act(() => {
      result.current.setCommentText('Will fail');
    });

    await act(async () => {
      try {
        await result.current.addTicketComment();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.comments).toEqual([mockComment]);
    expect(result.current.submitError).toBe('Failed to post');
    expect(result.current.submitting).toBe(false);
  });

  it('does not submit comment if text is empty or ticketId is missing', async () => {
    const { result } = renderHook(() => useTicketComments());

    await act(async () => {
      const res = await result.current.addTicketComment('');
      expect(res).toBeUndefined();
    });

    expect(ticketApi.addComment).not.toHaveBeenCalled();
  });

  it('supports fetchSeparately to load comments', async () => {
    vi.mocked(ticketApi.getComments).mockResolvedValueOnce([mockComment]);

    const { result } = renderHook(() =>
      useTicketComments({
        ticketId: 'ticket-1',
        fetchSeparately: true,
      })
    );

    await waitFor(() => {
      expect(result.current.comments).toEqual([mockComment]);
    });

    expect(ticketApi.getComments).toHaveBeenCalledWith('ticket-1');
  });

  it('handles fetchComments error when fetching separately', async () => {
    vi.mocked(ticketApi.getComments).mockRejectedValueOnce(new Error('Fetch failed'));

    const { result } = renderHook(() =>
      useTicketComments({
        ticketId: 'ticket-1',
        fetchSeparately: true,
      })
    );

    await waitFor(() => {
      expect(result.current.commentsError).toBe('Fetch failed');
    });

    expect(result.current.comments).toEqual([]);
  });

  it('allows manual setComments action', () => {
    const { result } = renderHook(() => useTicketComments({ ticketId: 'ticket-1' }));

    act(() => {
      result.current.setComments([mockComment]);
    });

    expect(result.current.comments).toEqual([mockComment]);
  });
});

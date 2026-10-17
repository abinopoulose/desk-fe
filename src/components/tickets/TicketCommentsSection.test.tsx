import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TicketCommentsSection } from './TicketCommentsSection';
import type { CommentDTO, TicketHistoryDTO } from '../../types/ticket';

describe('TicketCommentsSection', () => {
  afterEach(() => {
    cleanup();
  });

  const mockComments: CommentDTO[] = [
    {
      id: 'c1',
      ticketId: 't1',
      author: { id: 'u1', fullName: 'Alice Smith', email: 'alice@example.com' },
      content: 'First comment text',
      createdAt: new Date().toISOString(),
    },
  ];

  const mockHistory: TicketHistoryDTO[] = [
    {
      id: 'h1',
      changedByUserId: 'u2',
      changedByUserName: 'Bob Jones',
      changedAt: new Date().toISOString(),
      fieldName: 'status',
      oldValue: 'Open',
      newValue: 'In Progress',
    },
  ];

  it('renders browser tabs for Comments and Audit History and names tab Comments', () => {
    render(
      <TicketCommentsSection
        comments={mockComments}
        commentText=""
        onCommentTextChange={vi.fn()}
        submitting={false}
        onSubmit={vi.fn()}
        canWrite={true}
        history={mockHistory}
      />
    );

    // Tab buttons exist
    const commentsTab = screen.getByRole('tab', { name: /comments/i });
    const historyTab = screen.getByRole('tab', { name: /audit history/i });
    expect(commentsTab).toBeDefined();
    expect(historyTab).toBeDefined();

    // Verify "Activity & Comments" is NOT present
    expect(screen.queryByText('Activity & Comments')).toBeNull();

    // In comments tab by default
    expect(screen.getByText('First comment text')).toBeDefined();
    expect(screen.getByPlaceholderText(/leave a comment/i)).toBeDefined();
  });

  it('switches between Comments and Audit History tabs like a browser', () => {
    render(
      <TicketCommentsSection
        comments={mockComments}
        commentText=""
        onCommentTextChange={vi.fn()}
        submitting={false}
        onSubmit={vi.fn()}
        canWrite={true}
        history={mockHistory}
      />
    );

    const historyTab = screen.getByRole('tab', { name: /audit history/i });
    const commentsTab = screen.getByRole('tab', { name: /comments/i });

    // Click Audit History tab
    fireEvent.click(historyTab);

    // Audit history view should be visible
    expect(screen.getByText('Bob Jones')).toBeDefined();
    expect(screen.getByText('status')).toBeDefined();
    expect(screen.getByText('In Progress')).toBeDefined();
    // Comment input should not be visible in history tab
    expect(screen.queryByPlaceholderText(/leave a comment/i)).toBeNull();

    // Switch back to Comments tab
    fireEvent.click(commentsTab);
    expect(screen.getByText('First comment text')).toBeDefined();
    expect(screen.getByPlaceholderText(/leave a comment/i)).toBeDefined();
  });

  it('renders empty states appropriately', () => {
    render(
      <TicketCommentsSection
        comments={[]}
        commentText=""
        onCommentTextChange={vi.fn()}
        submitting={false}
        onSubmit={vi.fn()}
        canWrite={false}
        history={[]}
      />
    );

    expect(screen.getByText(/no updates or comments have been posted yet/i)).toBeDefined();

    const historyTab = screen.getByRole('tab', { name: /audit history/i });
    fireEvent.click(historyTab);

    expect(screen.getByText(/no historical changes recorded/i)).toBeDefined();
  });
});

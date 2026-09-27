import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TicketHistoryTimeline } from '../TicketHistoryTimeline';
import type { AuditEntry } from '../../../types/audit';
import type { CommentDTO } from '../../../types/ticket';

describe('TicketHistoryTimeline', () => {
  beforeEach(() => {
    // Mock date to ensure consistent timeAgo output
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  const mockUser = { id: '1', fullName: 'Alice Liddell', email: 'alice@example.com' };

  const mockHistory: AuditEntry[] = [
    {
      id: 'h1',
      ticketId: 't1',
      changedBy: mockUser,
      changedAt: '2023-10-10T10:00:00Z', // 2 hours ago
      fieldName: 'status',
      oldValue: 'Open',
      newValue: 'In Progress'
    }
  ];

  const mockComments: CommentDTO[] = [
    {
      id: 'c2',
      ticketId: 't1',
      author: { ...mockUser, avatarUrl: 'https://example.com/avatar.png' },
      content: 'This is a test comment.',
      createdAt: '2023-10-10T11:55:00Z' // 5 minutes ago
    }
  ];

  it('renders timeline with history and comments', () => {
    render(<TicketHistoryTimeline history={mockHistory} comments={mockComments} />);

    // Check title
    expect(screen.getByText('Timeline')).toBeInTheDocument();

    // Check history item
    expect(screen.getByText("Status changed from 'Open' to 'In Progress' by Alice Liddell")).toBeInTheDocument();
    
    // Check comment item
    expect(screen.getByText('Alice Liddell commented')).toBeInTheDocument();
    expect(screen.getByText('This is a test comment.')).toBeInTheDocument();

    // Check relative times (since we mock 'now' to 12:00)
    // 10:00 is 2 hours ago
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    // 11:55 is 5 minutes ago
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
  });

  it('displays empty state when no items provided', () => {
    render(<TicketHistoryTimeline history={[]} comments={[]} />);
    expect(screen.getByText('No history available.')).toBeInTheDocument();
  });

  it('can toggle sort order', () => {
    render(<TicketHistoryTimeline history={mockHistory} comments={mockComments} />);
    
    // By default, 'asc' order. 
    // Button text says "Sort: Oldest First"
    const sortBtn = screen.getByRole('button', { name: /Sort: Oldest First/i });
    expect(sortBtn).toBeInTheDocument();

    const listItemsBefore = screen.getAllByRole('listitem');
    // First item is older: 2 hours ago
    expect(listItemsBefore[0]).toHaveTextContent('2 hours ago');
    expect(listItemsBefore[1]).toHaveTextContent('5 minutes ago');

    // Click toggle
    fireEvent.click(sortBtn);

    // Button text updates
    expect(screen.getByRole('button', { name: /Sort: Newest First/i })).toBeInTheDocument();

    const listItemsAfter = screen.getAllByRole('listitem');
    // First item is newer: 5 minutes ago
    expect(listItemsAfter[0]).toHaveTextContent('5 minutes ago');
    expect(listItemsAfter[1]).toHaveTextContent('2 hours ago');
  });

  it('renders avatar image if available, else renders initials', () => {
    const customComments = [
      {
        id: 'c2',
        ticketId: 't1',
        author: { id: '1', fullName: 'Bob Builder', email: 'bob@example.com' }, // No avatar
        content: 'I have no avatar',
        createdAt: '2023-10-10T11:00:00Z'
      },
      ...mockComments // Has avatar
    ];
    
    render(<TicketHistoryTimeline history={[]} comments={customComments} />);
    
    // Avatar image
    const img = screen.getByAltText('Alice Liddell');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');

    // Initials fallback
    expect(screen.getByText('BB')).toBeInTheDocument();
  });
});

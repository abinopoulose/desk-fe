import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import {
  SLAIndicator,
  TicketHeader,
  TicketFormDataCard,
  TicketCommentsSection,
  TicketManagementCard,
  TicketAuditHistoryCard,
} from '../index';
import type { TicketDetailResponse, CommentDTO, TicketHistoryDTO } from '../../../types/ticket';

describe('Ticket Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('SLAIndicator', () => {
    it('renders Closed state when statusState is CLOSED', () => {
      render(
        <SLAIndicator
          createdAt={new Date().toISOString()}
          dueAt={new Date().toISOString()}
          breached={false}
          statusState="CLOSED"
        />
      );
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('renders breached state when breached is true', () => {
      render(
        <SLAIndicator
          createdAt={new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()}
          dueAt={new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()}
          breached={true}
          statusState="OPEN"
        />
      );
      expect(screen.getByText(/Breached by/)).toBeInTheDocument();
    });

    it('renders due soon state with yellow indicator when less than half time remaining', () => {
      const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString();
      const dueAt = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();
      render(
        <SLAIndicator
          createdAt={createdAt}
          dueAt={dueAt}
          breached={false}
          statusState="OPEN"
        />
      );
      const badge = screen.getByText(/Due in/);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-yellow-100');
    });

    it('renders on track state with green indicator when plenty of time remaining', () => {
      const createdAt = new Date().toISOString();
      const dueAt = new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString();
      render(
        <SLAIndicator
          createdAt={createdAt}
          dueAt={dueAt}
          breached={false}
          statusState="OPEN"
        />
      );
      const badge = screen.getByText(/Due in/);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-green-100');
    });
  });

  describe('TicketHeader', () => {
    const mockTicket: TicketDetailResponse = {
      id: 'ticket-12345678',
      ticketType: { id: 'type-1', title: 'Network Issue' },
      requester: { id: 'req-1', fullName: 'Alice Johnson', email: 'alice@example.com' },
      currentStatus: { id: 'status-open', name: 'Open', mappedState: 'OPEN' },
      priority: 2,
      formData: {},
      slaDueAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      slaBreached: false,
      comments: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('renders ticket details and handles copy click', () => {
      const onCopyId = vi.fn();
      render(
        <MemoryRouter>
          <TicketHeader ticket={mockTicket} onCopyId={onCopyId} />
        </MemoryRouter>
      );

      expect(screen.getByText('#ticket-1')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Network Issue')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();

      const copyBtn = screen.getByTitle('Copy ID');
      fireEvent.click(copyBtn);
      expect(onCopyId).toHaveBeenCalled();
    });

    it('copies to navigator.clipboard if no onCopyId callback provided', () => {
      const writeTextMock = vi.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <MemoryRouter>
          <TicketHeader ticket={mockTicket} />
        </MemoryRouter>
      );

      const copyBtn = screen.getByTitle('Copy ID');
      fireEvent.click(copyBtn);
      expect(writeTextMock).toHaveBeenCalledWith('ticket-12345678');
    });
  });

  describe('TicketFormDataCard', () => {
    it('renders boolean, array, and string values correctly', () => {
      const formData = {
        urgent: true,
        approved: false,
        servers: ['web-01', 'web-02'],
        description: 'Server unreachable',
        notes: '',
      };

      render(<TicketFormDataCard formData={formData} />);

      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.getByText('web-01')).toBeInTheDocument();
      expect(screen.getByText('web-02')).toBeInTheDocument();
      expect(screen.getByText('Server unreachable')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('TicketCommentsSection', () => {
    const mockComments: CommentDTO[] = [
      {
        id: 'c1',
        ticketId: 't1',
        author: { id: 'u1', fullName: 'Bob Martin', email: 'bob@example.com' },
        content: 'Investigating now.',
        createdAt: new Date().toISOString(),
      },
    ];

    it('renders comments and comment form for authorized writers', () => {
      const onSubmit = vi.fn((e) => e.preventDefault());
      const onTextChange = vi.fn();

      render(
        <MemoryRouter>
          <TicketCommentsSection
            comments={mockComments}
            commentText="My new note"
            onCommentTextChange={onTextChange}
            submitting={false}
            onSubmit={onSubmit}
            canWrite={true}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Bob Martin')).toBeInTheDocument();
      expect(screen.getByText('Investigating now.')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText('Write a comment...');
      expect(textarea).toHaveValue('My new note');

      const submitBtn = screen.getByRole('button', { name: 'Post Comment' });
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);
      expect(onSubmit).toHaveBeenCalled();
    });

    it('renders empty comments fallback message and hides form when canWrite is false', () => {
      render(
        <MemoryRouter>
          <TicketCommentsSection
            comments={[]}
            commentText=""
            onCommentTextChange={() => {}}
            submitting={false}
            onSubmit={() => {}}
            canWrite={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('No comments yet.')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
    });
  });

  describe('TicketManagementCard', () => {
    it('renders editable dropdowns when canManage is true', () => {
      const onStatusChange = vi.fn();
      const onAssigneeChange = vi.fn();

      render(
        <MemoryRouter>
          <TicketManagementCard
            currentStatus={{ id: 'status-open', name: 'Open', mappedState: 'OPEN' }}
            assignee={{ id: 'u1', fullName: 'Alice', email: 'alice@example.com' }}
            canManage={true}
            onStatusChange={onStatusChange}
            onAssigneeChange={onAssigneeChange}
          />
        </MemoryRouter>
      );

      const dropdowns = screen.getAllByRole('combobox');
      expect(dropdowns.length).toBe(2);

      fireEvent.change(dropdowns[0], { target: { value: 'status-closed' } });
      expect(onStatusChange).toHaveBeenCalled();

      fireEvent.change(dropdowns[1], { target: { value: '' } });
      expect(onAssigneeChange).toHaveBeenCalled();
    });

    it('renders readonly text when canManage is false', () => {
      render(
        <MemoryRouter>
          <TicketManagementCard
            currentStatus={{ id: 'status-open', name: 'Open', mappedState: 'OPEN' }}
            assignee={undefined}
            canManage={false}
            onStatusChange={() => {}}
            onAssigneeChange={() => {}}
          />
        </MemoryRouter>
      );

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });
  });

  describe('TicketAuditHistoryCard', () => {
    it('renders audit history entries and empty state', () => {
      const mockHistory: TicketHistoryDTO[] = [
        {
          id: 'h1',
          changedByUserId: 'u1',
          changedByUserName: 'Admin User',
          changedAt: new Date().toISOString(),
          fieldName: 'priority',
          oldValue: 'Low',
          newValue: 'Critical',
        },
      ];

      const { rerender } = render(<TicketAuditHistoryCard history={mockHistory} />);
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('priority')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();

      rerender(<TicketAuditHistoryCard history={[]} />);
      expect(screen.getByText('No history available.')).toBeInTheDocument();
    });
  });
});

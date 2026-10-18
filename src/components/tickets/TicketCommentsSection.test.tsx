import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  TicketCommentsSection,
  formatContentForSubmission,
  parseCommentAttachment,
  formatFileSize,
} from './TicketCommentsSection';
import * as employeeApi from '../../api/employeeApi';
import type { CommentDTO, TicketHistoryDTO } from '../../types/ticket';
import type { User } from '../../types/user';

vi.mock('../../api/employeeApi', () => ({
  getOrgUsers: vi.fn(),
}));

describe('TicketCommentsSection', () => {
  const mockComments: CommentDTO[] = [
    {
      id: 'c1',
      ticketId: 't1',
      author: { id: 'u1', fullName: 'Alice Smith', email: 'alice@example.com' },
      content: 'First comment text',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c2',
      ticketId: 't1',
      author: { id: 'u2', fullName: 'Basil Joby', email: 'basil@example.com' },
      content: 'Check @[Alice Smith](u1) on this ticket',
      attachments: [
        JSON.stringify({
          name: 'error-log.txt',
          size: 2048,
          type: 'text/plain',
          url: 'data:text/plain;base64,ZXJyb3I=',
        }),
        JSON.stringify({
          name: 'screenshot.png',
          size: 154200,
          type: 'image/png',
          url: 'data:image/png;base64,iVBORw0KGgo=',
        }),
      ],
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

  const mockUsers: User[] = [
    {
      id: '4696475c-7ff5-47b7-b748-efab77c9bc34',
      fullName: 'Basil Joby',
      email: 'basil@example.com',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    },
    {
      id: 'u1',
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      roles: ['EMPLOYEE'],
      status: 'ACTIVE',
    },
  ];

  beforeEach(() => {
    vi.mocked(employeeApi.getOrgUsers).mockResolvedValue(mockUsers);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

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

    const commentsTab = screen.getByRole('tab', { name: /comments/i });
    const historyTab = screen.getByRole('tab', { name: /audit history/i });
    expect(commentsTab).toBeDefined();
    expect(historyTab).toBeDefined();

    expect(screen.queryByText('Activity & Comments')).toBeNull();
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

    fireEvent.click(historyTab);
    expect(screen.getByText('Bob Jones')).toBeDefined();
    expect(screen.getByText('status')).toBeDefined();
    expect(screen.getByText('In Progress')).toBeDefined();
    expect(screen.queryByPlaceholderText(/leave a comment/i)).toBeNull();

    fireEvent.click(commentsTab);
    expect(screen.getByText('First comment text')).toBeDefined();
    expect(screen.getByPlaceholderText(/leave a comment/i)).toBeDefined();
  });

  it('renders author name outside the comment box', () => {
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

    // Author name Alice Smith is rendered
    const authorHeader = screen.getByText('Alice Smith');
    expect(authorHeader).toBeDefined();

    // Verify comment text is inside a distinct comment bubble
    const commentBody = screen.getByText('First comment text');
    expect(commentBody).toBeDefined();

    // The comment box container does not have the author name inside it
    expect(commentBody.parentElement?.textContent).not.toContain('Alice Smith');
  });

  it('renders Jira-style file attachments in comments with preview and download', () => {
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

    // Document attachment
    expect(screen.getByText('error-log.txt')).toBeDefined();
    expect(screen.getByText('2.0 KB')).toBeDefined();
    const downloadDoc = screen.getByTitle('Download error-log.txt');
    expect(downloadDoc).toBeDefined();

    // Image attachment
    expect(screen.getByText('screenshot.png')).toBeDefined();
    const imgEl = screen.getByAltText('screenshot.png');
    expect(imgEl).toBeDefined();
    const downloadImg = screen.getByTitle('Download screenshot.png');
    expect(downloadImg).toBeDefined();
  });

  it('supports attaching files in draft mode with preview and remove button', async () => {
    const onSubmit = vi.fn();
    render(
      <TicketCommentsSection
        comments={mockComments}
        commentText="Here are the logs"
        onCommentTextChange={vi.fn()}
        submitting={false}
        onSubmit={onSubmit}
        canWrite={true}
        history={mockHistory}
      />
    );

    // Attach files button exists
    const attachBtn = screen.getByRole('button', { name: /attach files/i });
    expect(attachBtn).toBeDefined();

    // File input exists
    const fileInput = screen.getByLabelText('Upload comment attachment');
    expect(fileInput).toBeDefined();

    // Simulate attaching a file
    const file = new File(['test file content'], 'test-attachment.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Attachment chip appears in draft preview
    await waitFor(() => {
      expect(screen.getByText('test-attachment.pdf')).toBeDefined();
    });

    // Remove button removes it from draft
    const removeBtn = screen.getByLabelText('Remove test-attachment.pdf');
    fireEvent.click(removeBtn);
    expect(screen.queryByText('test-attachment.pdf')).toBeNull();
  });

  it('inserts clean @Name during mention drafting instead of ugly @[Name](uuid)', async () => {
    const onCommentTextChange = vi.fn();

    const TestHarness = () => {
      const [text, setText] = React.useState('');
      return (
        <TicketCommentsSection
          comments={[]}
          commentText={text}
          onCommentTextChange={(val) => {
            setText(val);
            onCommentTextChange(val);
          }}
          submitting={false}
          onSubmit={vi.fn()}
          canWrite={true}
          availableUsers={mockUsers}
        />
      );
    };

    render(<TestHarness />);

    // Trigger textarea change with @Bas to pop open mention menu
    const textarea = screen.getByPlaceholderText(/leave a comment/i);
    fireEvent.change(textarea, { target: { value: '@Bas' } });

    // Mention popover shows Basil Joby
    await waitFor(() => {
      expect(screen.getByText('Mention Teammate')).toBeDefined();
      expect(screen.getByText('Basil Joby')).toBeDefined();
    });

    // Click Basil Joby to select mention
    const userBtn = screen.getByText('Basil Joby');
    fireEvent.click(userBtn);

    // Verify it inserted clean "@Basil Joby " without ugly UUID or square brackets!
    expect(onCommentTextChange).toHaveBeenCalledWith('@Basil Joby ');
    expect(onCommentTextChange).not.toHaveBeenCalledWith(expect.stringContaining('4696475c-7ff5-47b7-b748-efab77c9bc34'));
  });

  it('formatContentForSubmission formats clean mentions to backend format upon submitting', () => {
    const rawDraft = 'Hello @Basil Joby, could you look into this? CC @Alice Smith';
    const formatted = formatContentForSubmission(rawDraft, mockUsers);

    expect(formatted).toBe(
      'Hello @[Basil Joby](4696475c-7ff5-47b7-b748-efab77c9bc34), could you look into this? CC @[Alice Smith](u1)'
    );
  });

  it('parses attachment JSON and formats file sizes accurately', () => {
    const jsonStr = JSON.stringify({
      name: 'doc.pdf',
      size: 1048576,
      type: 'application/pdf',
      url: 'https://storage/doc.pdf',
    });
    const parsed = parseCommentAttachment(jsonStr);
    expect(parsed.name).toBe('doc.pdf');
    expect(parsed.type).toBe('application/pdf');
    expect(parsed.url).toBe('https://storage/doc.pdf');

    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });
});

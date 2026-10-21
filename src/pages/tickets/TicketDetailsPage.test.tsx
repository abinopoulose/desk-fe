import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { TicketDetailsPage } from './TicketDetailsPage';
import { ticketApi } from '../../api/ticketApi';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import { getOrgUsers } from '../../api/employeeApi';
import * as hooks from '../../hooks';
import type { TicketDetailResponse, TicketStatusDTO } from '../../types/ticket';

vi.mock('../../store/authStore', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'USER-1', fullName: 'Abino Poulose', email: 'abino@example.com' },
    isSuperAdmin: false,
    hasPrivilege: () => true,
  })),
  useAuthStore: vi.fn(),
}));
vi.mock('../../api/ticketApi', () => ({
  ticketApi: {
    getTickets: vi.fn(),
    createTicket: vi.fn(),
    getTicketSchema: vi.fn(),
    getTicketDetails: vi.fn(),
    updateTicketStatus: vi.fn(),
    assignTicket: vi.fn(),
    addComment: vi.fn(),
    getComments: vi.fn(),
    getTicketAccess: vi.fn().mockResolvedValue({
      ticketId: 'TECH-2',
      requester: { id: 'USER-1', fullName: 'Abino Poulose', email: 'abino@example.com' },
      assignee: null,
      primaryDepartment: null,
      sharedUsers: [],
      sharedDepartments: [],
    }),
    shareTicket: vi.fn(),
    unshareTicket: vi.fn(),
    requestAccess: vi.fn(),
    escalateTicket: vi.fn(),
  },
}));
vi.mock('../../api/ticketTypeApi', () => ({
  ticketTypeApi: {
    getTicketTypeById: vi.fn(),
    getTicketStatuses: vi.fn(),
  },
}));
vi.mock('../../api/employeeApi', () => ({
  getOrgUsers: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../hooks', () => ({
  useTicketDetails: vi.fn(),
  useTicketComments: vi.fn().mockReturnValue({
    comments: [],
    commentText: '',
    setCommentText: vi.fn(),
    submitting: false,
    handleSubmitComment: vi.fn(),
  }),
}));

describe('TicketDetailsPage - Access Restricted & Request Access', () => {
  const mockTicketId = 'TECH-2';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValue({} as any);
    vi.mocked(ticketTypeApi.getTicketStatuses).mockResolvedValue([]);
    vi.mocked(getOrgUsers).mockResolvedValue([]);
    vi.mocked(hooks.useTicketComments).mockReturnValue({
      comments: [],
      commentText: '',
      setCommentText: vi.fn(),
      submitting: false,
      handleSubmitComment: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('renders Access Restricted screen when user does not have permission (isForbidden: true)', () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: null,
      loading: false,
      error: 'You do not have permission to view this ticket',
      statusCode: 403,
      isForbidden: true,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('region', { name: /access restricted/i })).toBeDefined();
    expect(screen.getByText(/you do not have access to this ticket/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /request access/i })).toBeDefined();
  });

  it('sends access request and shows confirmation when Request Access button is clicked', async () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: null,
      loading: false,
      error: 'You do not have permission to view this ticket',
      statusCode: 403,
      isForbidden: true,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    vi.mocked(ticketApi.requestAccess).mockResolvedValue({
      message: 'Access request sent successfully',
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    const requestButton = screen.getByRole('button', { name: /request access/i });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(ticketApi.requestAccess).toHaveBeenCalledWith(mockTicketId);
    });

    await waitFor(() => {
      expect(screen.getByText(/access request sent/i)).toBeDefined();
      expect(screen.getByText(/creator and assignee have been notified/i)).toBeDefined();
    });
  });

  it('displays error message if access request fails', async () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: null,
      loading: false,
      error: 'You do not have permission to view this ticket',
      statusCode: 403,
      isForbidden: true,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    vi.mocked(ticketApi.requestAccess).mockRejectedValue({
      message: 'Network error occurred',
      statusCode: 500,
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    const requestButton = screen.getByRole('button', { name: /request access/i });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(screen.getByText('Network error occurred')).toBeDefined();
    });
  });
});

describe('TicketDetailsPage - SLA Escalation', () => {
  const mockTicketId = 'TECH-2';
  const breachedTicket: TicketDetailResponse = {
    id: 'TECH-2',
    displayId: 'TECH-2',
    title: 'Server Outage in Production',
    ticketType: { id: 'tt-1', title: 'Technical Issue' },
    requester: { id: 'USER-1', fullName: 'Abino Poulose', email: 'abino@example.com' },
    assignee: { id: 'USER-2', fullName: 'Specialist Alice', email: 'alice@example.com' },
    currentStatus: { id: 's-1', name: 'Open', mappedState: 'OPEN' },
    priority: 1,
    formData: {},
    slaDueAt: new Date(Date.now() - 3600000).toISOString(),
    slaBreached: true,
    escalated: false,
    comments: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValue({} as any);
    vi.mocked(ticketTypeApi.getTicketStatuses).mockResolvedValue([]);
    vi.mocked(ticketApi.getTicketAccess).mockResolvedValue({
      ticketId: 'TECH-2',
      requester: { id: 'USER-1', fullName: 'Abino Poulose', email: 'abino@example.com' },
      assignee: null,
      primaryDepartment: null,
      sharedUsers: [],
      sharedDepartments: [],
    });
    vi.mocked(getOrgUsers).mockResolvedValue([]);
    vi.mocked(hooks.useTicketComments).mockReturnValue({
      comments: [],
      commentText: '',
      setCommentText: vi.fn(),
      submitting: false,
      handleSubmitComment: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('renders Escalate button when current user is creator and SLA is breached', () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: breachedTicket,
      loading: false,
      error: null,
      statusCode: null,
      isForbidden: false,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    const escalateButtons = screen.getAllByRole('button', { name: /escalate/i });
    expect(escalateButtons.length).toBeGreaterThan(0);
  });

  it('does not render Escalate button when ticket is already escalated', () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: { ...breachedTicket, escalated: true },
      loading: false,
      error: null,
      statusCode: null,
      isForbidden: false,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /escalate/i })).toBeNull();
    expect(screen.getByTestId('escalated-tag')).toBeDefined();
  });

  it('calls ticketApi.escalateTicket when Escalate button is clicked', async () => {
    const mockSetTicket = vi.fn();
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: breachedTicket,
      loading: false,
      error: null,
      statusCode: null,
      isForbidden: false,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: mockSetTicket,
    });

    vi.mocked(ticketApi.escalateTicket).mockResolvedValue({
      ...breachedTicket,
      escalated: true,
      escalatedAt: new Date().toISOString(),
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    const escalateBtn = screen.getByTestId('escalate-ticket-button');
    fireEvent.click(escalateBtn);

    await waitFor(() => {
      expect(ticketApi.escalateTicket).toHaveBeenCalledWith(mockTicketId);
      expect(mockSetTicket).toHaveBeenCalled();
    });
  });

  it('automatically adds tagged users in comment to participants list via shareTicket', async () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: {
        id: mockTicketId,
        title: 'Test Ticket',
        description: 'Test description',
        status: 'Open',
        priority: 'MEDIUM',
        ticketType: { id: 'type-1', name: 'Support', category: 'General' },
        currentStatus: { id: 's1', name: 'Open', color: '#6366f1' },
        requester: { id: 'u1', fullName: 'Requester', email: 'req@example.com' },
        assignee: null,
        comments: [],
        history: [],
      } as any,
      loading: false,
      error: null,
      statusCode: null,
      isForbidden: false,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    vi.mocked(hooks.useTicketComments).mockReturnValue({
      comments: [],
      commentText: 'Hey @[Alice](user-123)',
      setCommentText: vi.fn(),
      submitting: false,
      handleSubmitComment: vi.fn().mockResolvedValue({} as any),
    } as any);

    vi.mocked(ticketApi.shareTicket).mockResolvedValue({} as any);
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValue({} as any);

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    const postBtn = screen.getByRole('button', { name: /post comment/i });
    expect(postBtn).toBeDefined();

    const form = postBtn.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(ticketApi.shareTicket).toHaveBeenCalledWith(mockTicketId, {
        shareType: 'USER',
        targetId: 'user-123',
      });
    });
  });
});

describe('TicketDetailsPage - Status & Assignee Permissions', () => {
  const mockTicketId = 'TECH-2';
  const baseTicket: TicketDetailResponse = {
    id: 'TECH-2',
    displayId: 'TECH-2',
    title: 'Server Outage in Production',
    ticketType: { id: 'tt-1', title: 'Technical Issue' },
    requester: { id: 'USER-1', fullName: 'Abino Poulose', email: 'abino@example.com' },
    assignee: { id: 'USER-2', fullName: 'Specialist Alice', email: 'alice@example.com' },
    currentStatus: { id: 's-open', name: 'Open', mappedState: 'OPEN' },
    priority: 1,
    formData: {},
    slaDueAt: new Date().toISOString(),
    slaBreached: false,
    escalated: false,
    comments: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockStatuses: TicketStatusDTO[] = [
    { id: 's-open', name: 'Open', mappedState: 'OPEN', displayOrder: 0 },
    { id: 's-progress', name: 'In Progress', mappedState: 'OPEN', displayOrder: 1 },
    { id: 's-closed', name: 'Closed', mappedState: 'CLOSED', displayOrder: 2 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValue({} as any);
    vi.mocked(ticketTypeApi.getTicketStatuses).mockResolvedValue(mockStatuses);
    vi.mocked(ticketApi.getTicketAccess).mockResolvedValue({
      ticketId: 'TECH-2',
      requester: { id: 'USER-1', fullName: 'Abino Poulose', email: 'abino@example.com' },
      assignee: null,
      primaryDepartment: null,
      sharedUsers: [],
      sharedDepartments: [],
    });
    vi.mocked(getOrgUsers).mockResolvedValue([]);
    vi.mocked(hooks.useTicketComments).mockReturnValue({
      comments: [],
      commentText: '',
      setCommentText: vi.fn(),
      submitting: false,
      handleSubmitComment: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('renders all statuses when canChangeStatus is true on ticket', async () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: { ...baseTicket, canChangeStatus: true, canCloseTicket: true, canManageTicket: true },
      loading: false,
      error: null,
      statusCode: null,
      isForbidden: false,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeDefined();
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });
  });

  it('renders only current and closed statuses when canChangeStatus is false but canCloseTicket is true', async () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: { ...baseTicket, canChangeStatus: false, canCloseTicket: true, canManageTicket: false },
      loading: false,
      error: null,
      statusCode: null,
      isForbidden: false,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeDefined();
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      const texts = options.map((o) => o.textContent);
      expect(texts).toContain('Open (OPEN)');
      expect(texts).toContain('Closed (CLOSED)');
      expect(texts).not.toContain('In Progress (OPEN)');
    });
  });

  it('renders read-only status and read-only assignee when canChangeStatus and canCloseTicket are false', async () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: { ...baseTicket, canChangeStatus: false, canCloseTicket: false, canManageTicket: false },
      loading: false,
      error: null,
      statusCode: null,
      isForbidden: false,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByRole('combobox')).toBeNull();
      expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
      expect(screen.getByText('Specialist Alice')).toBeDefined();
      expect(screen.queryByRole('button', { expanded: false })).toBeNull();
    });
  });

  it('allows assignee management when canManageTicket is true', async () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: { ...baseTicket, canChangeStatus: false, canCloseTicket: false, canManageTicket: true },
      loading: false,
      error: null,
      statusCode: null,
      isForbidden: false,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { expanded: false })).toBeDefined();
      expect(screen.getByText('Specialist Alice')).toBeDefined();
    });
  });

  it('allows assignee management when current logged-in user is the assignee even if canManageTicket is undefined and canChangeStatus is false', async () => {
    vi.mocked(hooks.useTicketDetails).mockReturnValue({
      ticket: {
        ...baseTicket,
        assignee: { id: 'USER-1', fullName: 'Abino Poulose', email: 'abino@example.com' },
        canChangeStatus: false,
        canCloseTicket: false,
        canManageTicket: undefined,
      },
      loading: false,
      error: null,
      statusCode: null,
      isForbidden: false,
      fetchTicketById: vi.fn(),
      fetchTicket: vi.fn(),
      refetch: vi.fn(),
      updateStatus: vi.fn(),
      updateTicketStatus: vi.fn(),
      changeStatus: vi.fn(),
      transitionStatus: vi.fn(),
      assignTicket: vi.fn(),
      updateTicket: vi.fn(),
      setTicket: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/tickets/${mockTicketId}`]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { expanded: false })).toBeDefined();
      expect(screen.getAllByText('Abino Poulose').length).toBeGreaterThan(0);
    });
  });
});


import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { TicketDetailsPage } from './TicketDetailsPage';
import { ticketApi } from '../../api/ticketApi';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import { getOrgUsers } from '../../api/employeeApi';
import * as hooks from '../../hooks';
import type { TicketDetailResponse } from '../../types/ticket';

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
});

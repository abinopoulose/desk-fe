/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TicketDetailsPage } from '../TicketDetailsPage';
import { ticketApi } from '../../../api/ticketApi';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useAuth } from '../../../store/authStore';

vi.mock('../../../api/ticketApi', () => ({
  ticketApi: {
    getTicketDetails: vi.fn(),
    updateTicketStatus: vi.fn(),
    assignTicket: vi.fn(),
    addComment: vi.fn(),
  },
}));

vi.mock('../../../store/authStore', () => ({
  useAuth: vi.fn(),
}));

const mockTicket = {
  id: 'ticket-12345678',
  ticketType: { id: 'type-1', title: 'Hardware Request' },
  requester: { id: 'req-1', fullName: 'John Doe', email: 'john@example.com' },
  assignee: { id: 'agent-1', fullName: 'Agent Smith', email: 'agent@example.com' },
  currentStatus: { id: 'status-open', name: 'Open', mappedState: 'OPEN' },
  priority: 1, // Critical
  formData: { device: 'MacBook Pro', needsAccessories: true, memory: [16, 32] },
  slaDueAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), // 5 hours from now
  slaBreached: false,
  comments: [
    {
      id: 'comment-1',
      ticketId: 'ticket-12345678',
      author: { id: 'agent-1', fullName: 'Agent Smith', email: 'agent@example.com' },
      content: 'I will look into this.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    }
  ],
  history: [
    {
      id: 'hist-1',
      changedByUserId: 'req-1',
      changedByUserName: 'John Doe',
      changedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      fieldName: 'status',
      oldValue: 'New',
      newValue: 'Open'
    }
  ],
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
};

describe('TicketDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      hasPrivilege: () => false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: null as any,
      isAuthenticated: true
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (initialEntry = '/tickets/ticket-12345678') => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders ticket details loading state and then complete information', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValue(mockTicket as any) 
    
    renderComponent();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('#ticket-1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Hardware Request')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    
    // formData rendered
    expect(screen.getByText(/device/i)).toBeInTheDocument();
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText(/needs accessories/i)).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    
    // comments rendered
    expect(screen.getByText('I will look into this.')).toBeInTheDocument();
    
    // history rendered (in collapsible, text should be accessible)
    expect(screen.getByText(/changed.*from.*to/)).toBeInTheDocument();
  });

  it('handles API error on fetch', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockRejectedValue(new Error('API Error')); 
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('shows status and assignee dropdowns only for management users', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValue(mockTicket as any) 
    
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('#ticket-1')).toBeInTheDocument();
    });
    
    // Default mock has no privileges
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    
    cleanup();
    
    // Now with privileges
    vi.mocked(useAuth).mockReturnValue({
      hasPrivilege: (p: string) => p === 'TICKET_MANAGEMENT',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: null as any,
      isAuthenticated: true
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('#ticket-1')).toBeInTheDocument();
    });
    
    const dropdowns = screen.getAllByRole('combobox');
    expect(dropdowns.length).toBe(2); // status and assignee
  });

  it('allows management users to update status and assignee', async () => {
    vi.mocked(useAuth).mockReturnValue({
      hasPrivilege: (p: string) => p === 'TICKET_MANAGEMENT',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: null as any,
      isAuthenticated: true
    });
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValue(mockTicket as any) 
    vi.mocked(ticketApi.updateTicketStatus).mockResolvedValue({} as any) 
    vi.mocked(ticketApi.assignTicket).mockResolvedValue({} as any) 

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('#ticket-1')).toBeInTheDocument();
    });

    const dropdowns = screen.getAllByRole('combobox');
    const statusSelect = dropdowns[0];
    const assigneeSelect = dropdowns[1];

    fireEvent.change(statusSelect, { target: { value: 'status-closed' } });
    expect(ticketApi.updateTicketStatus).toHaveBeenCalledWith('ticket-12345678', 'status-closed');

    fireEvent.change(assigneeSelect, { target: { value: '' } });
    expect(ticketApi.assignTicket).toHaveBeenCalledWith('ticket-12345678', null);
  });

  it('shows add comment form only for users with write privilege and handles submission', async () => {
    vi.mocked(ticketApi.getTicketDetails).mockResolvedValue(mockTicket as any) 
    
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('#ticket-1')).toBeInTheDocument();
    });
    
    // Default mock has no privileges
    expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
    
    cleanup();
    
    // Write privilege
    vi.mocked(useAuth).mockReturnValue({
      hasPrivilege: (p: string) => p === 'TICKET_WRITE',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: null as any,
      isAuthenticated: true
    });
    vi.mocked(ticketApi.addComment).mockResolvedValue({
      id: 'comment-2',
      ticketId: 'ticket-12345678',
      author: { id: 'req-1', fullName: 'John Doe', email: 'john@example.com' },
      content: 'New comment here!',
      createdAt: new Date().toISOString()
    } as any) 

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('#ticket-1')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Write a comment...');
    const submitBtn = screen.getByRole('button', { name: 'Post Comment' });
    
    expect(submitBtn).toBeDisabled();
    
    fireEvent.change(textarea, { target: { value: 'New comment here!' } });
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);
    expect(ticketApi.addComment).toHaveBeenCalledWith('ticket-12345678', 'New comment here!');
    
    await waitFor(() => {
      expect(screen.getByText('New comment here!')).toBeInTheDocument();
    });
  });
});

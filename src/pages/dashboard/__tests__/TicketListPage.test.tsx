import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { TicketListPage } from '../TicketListPage';
import { useAuth } from '../../../store/authStore';
import { ticketApi } from '../../../api/ticketApi';

vi.mock('../../../store/authStore');
vi.mock('../../../api/ticketApi');

describe('TicketListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1' },
      hasPrivilege: vi.fn().mockReturnValue(true)
    });
    
    (ticketApi.getTickets as any).mockResolvedValue({
      content: [
        {
          id: 'ticket-1',
          ticketTypeTitle: 'Laptop Issue',
          departmentName: 'IT',
          requesterName: 'John Doe',
          assigneeName: 'Jane Smith',
          statusName: 'Open',
          mappedState: 'OPEN',
          priority: 1,
          slaDueAt: '2023-12-01T00:00:00Z',
          slaBreached: true,
          createdAt: '2023-11-01T00:00:00Z'
        }
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      last: true
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => {
    render(
      <MemoryRouter>
        <TicketListPage />
      </MemoryRouter>
    );
  };

  it('renders dashboard and fetches tickets', async () => {
    renderComponent();
    expect(screen.getByText('Ticket Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Laptop Issue')).toBeInTheDocument();
    expect(await screen.findByText('Breached')).toBeInTheDocument();
    
    expect(ticketApi.getTickets).toHaveBeenCalledWith(expect.objectContaining({
      tab: 'my',
      page: 0,
      size: 20,
      sort: 'createdAt,desc',
      requesterId: 'user-1'
    }));
  });

  it('switches tabs and fetches assigned tickets', async () => {
    renderComponent();
    const assignedTab = screen.getByText('Assigned to Me');
    fireEvent.click(assignedTab);
    
    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(expect.objectContaining({
        tab: 'assigned',
        assigneeId: 'user-1'
      }));
    });
  });

  it('switches tabs and fetches all tickets', async () => {
    renderComponent();
    const allTab = screen.getByText('All Tickets');
    fireEvent.click(allTab);
    
    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(expect.objectContaining({
        tab: 'all'
      }));
    });
  });

  it('applies search filter', async () => {
    renderComponent();
    const searchInput = screen.getByPlaceholderText('Search by ID or Requester');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    
    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(expect.objectContaining({
        search: 'Jane'
      }));
    }, { timeout: 1000 });
  });

  it('applies status filter', async () => {
    renderComponent();
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'OPEN' } });
    
    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(expect.objectContaining({
        status: 'OPEN'
      }));
    });
  });

  it('handles sorting', async () => {
    renderComponent();
    const priorityHeader = screen.getByText(/Priority/);
    fireEvent.click(priorityHeader);
    
    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(expect.objectContaining({
        sort: 'priority,asc'
      }));
    });
    
    fireEvent.click(priorityHeader);
    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(expect.objectContaining({
        sort: 'priority,desc'
      }));
    });
  });

  it('handles pagination', async () => {
    (ticketApi.getTickets as any).mockResolvedValue({
      content: [],
      page: 0,
      size: 20,
      totalElements: 40,
      totalPages: 2,
      last: false
    });
    renderComponent();
    
    const nextBtn = await screen.findByText('Next');
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(expect.objectContaining({
        page: 1
      }));
    });
  });
  
  it('navigates on row click', async () => {
    renderComponent();
    await screen.findByText('Laptop Issue');
    const row = screen.getByText('Laptop Issue').closest('tr');
    fireEvent.click(row!);
  });
});

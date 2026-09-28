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
    (useAuth as import("vitest").Mock).mockReturnValue({
      user: { id: 'user-1' },
      hasPrivilege: vi.fn().mockReturnValue(true)
    });
    
    (ticketApi.getTickets as import("vitest").Mock).mockResolvedValue({
      tickets: [
        {
          id: 'ticket-1',
          ticketTypeId: 'type-1',
          ticketTypeTitle: 'Laptop Issue',
          requesterId: 'user-1',
          requesterName: 'John Doe',
          assigneeId: 'user-2',
          assigneeName: 'Jane Smith',
          currentStatusId: 'status-1',
          currentStatusName: 'Open',
          mappedState: 'OPEN',
          priority: 1,
          formData: {},
          slaDueAt: '2023-12-01T00:00:00Z',
          slaBreached: true,
          createdAt: '2023-11-01T00:00:00Z',
          updatedAt: '2023-11-01T00:00:00Z'
        }
      ],
      currentPage: 0,
      totalElements: 1,
      totalPages: 1,
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

  it('applies mappedState filter', async () => {
    renderComponent();
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'OPEN' } });
    
    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(expect.objectContaining({
        mappedState: 'OPEN'
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
    (ticketApi.getTickets as import("vitest").Mock).mockResolvedValue({
      tickets: [],
      currentPage: 0,
      totalElements: 40,
      totalPages: 2,
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

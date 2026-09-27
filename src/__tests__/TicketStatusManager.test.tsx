import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { TicketStatusManager } from '../pages/admin/TicketStatusManager';
import { ticketTypeApi } from '../api/ticketTypeApi';
import { useAuthStore } from '../store/authStore';
import { TicketTypeDTO, TicketStatusDTO } from '../types/ticket';

vi.mock('../api/ticketTypeApi');

describe('TicketStatusManager', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ privileges: ['TICKET_TYPE_WRITE'] });
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithRouter = (initialEntries = ['/statuses/1']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/statuses/:id" element={<TicketStatusManager />} />
        </Routes>
      </MemoryRouter>
    );
  };

  const mockTicketType = { title: 'Test Type' } as TicketTypeDTO;

  it('renders and fetches statuses', async () => {
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValueOnce(mockTicketType);
    vi.mocked(ticketTypeApi.getTicketStatuses).mockResolvedValueOnce([
      { id: 's1', name: 'Open Status', mappedState: 'OPEN', displayOrder: 0 }
    ]);

    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Open Status')).toBeInTheDocument();
    });
  });

  it('adds a new status', async () => {
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValue(mockTicketType);
    vi.mocked(ticketTypeApi.getTicketStatuses).mockResolvedValue([]);
    vi.mocked(ticketTypeApi.createTicketStatus).mockResolvedValueOnce({} as TicketStatusDTO);

    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('+ Add Status')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('+ Add Status'));
    
    expect(screen.getByText('Add Status')).toBeInTheDocument();
    
    fireEvent.change(screen.getByPlaceholderText('e.g. In Progress'), { target: { value: 'New Status' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(ticketTypeApi.createTicketStatus).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'New Status' }));
    });
  });

  it('handles delete', async () => {
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValue(mockTicketType);
    vi.mocked(ticketTypeApi.getTicketStatuses).mockResolvedValue([
      { id: 's1', name: 'Open Status', mappedState: 'OPEN', displayOrder: 0 }
    ]);
    vi.mocked(ticketTypeApi.deleteTicketStatus).mockResolvedValueOnce(undefined);
    window.confirm = vi.fn().mockReturnValue(true);

    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Delete'));
    
    await waitFor(() => {
      expect(ticketTypeApi.deleteTicketStatus).toHaveBeenCalledWith('s1');
    });
  });
});

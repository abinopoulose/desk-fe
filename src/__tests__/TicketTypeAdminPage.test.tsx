import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { TicketTypeAdminPage } from '../pages/admin/TicketTypeAdminPage';
import { ticketTypeApi } from '../api/ticketTypeApi';
import { useAuthStore } from '../store/authStore';
import { TicketTypeSummaryDTO, TicketTypeDTO } from '../types/ticket';

vi.mock('../api/ticketTypeApi');

describe('TicketTypeAdminPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ privileges: ['TICKET_TYPE_WRITE'] });
  });

  afterEach(() => {
    cleanup();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <TicketTypeAdminPage />
      </MemoryRouter>
    );
  };

  it('renders and fetches data', async () => {
    const mockData: TicketTypeSummaryDTO[] = [
      { id: '1', title: 'Hardware Issue', departmentId: 'IT', folderPath: 'IT', isActive: true }
    ];
    vi.mocked(ticketTypeApi.getTicketTypes).mockResolvedValueOnce(mockData);

    renderPage();
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Hardware Issue')).toBeInTheDocument();
    });
    
    expect(ticketTypeApi.getTicketTypes).toHaveBeenCalledWith(true);
  });

  it('handles search filtering', async () => {
    const mockData: TicketTypeSummaryDTO[] = [
      { id: '1', title: 'Hardware Issue', departmentId: 'IT', folderPath: 'IT', isActive: true },
      { id: '2', title: 'Software Request', departmentId: 'IT', folderPath: 'IT', isActive: true }
    ];
    vi.mocked(ticketTypeApi.getTicketTypes).mockResolvedValueOnce(mockData);

    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText('Hardware Issue')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText('Search by title...'), { target: { value: 'soft' } });
    
    expect(screen.queryByText('Hardware Issue')).not.toBeInTheDocument();
    expect(screen.getByText('Software Request')).toBeInTheDocument();
  });

  it('handles toggle active', async () => {
    const mockData: TicketTypeSummaryDTO[] = [
      { id: '1', title: 'Hardware Issue', departmentId: 'IT', folderPath: 'IT', isActive: true }
    ];
    vi.mocked(ticketTypeApi.getTicketTypes).mockResolvedValue(mockData);
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValueOnce({
      ...mockData[0], folderId: 'f1', formSchema: {}
    });
    vi.mocked(ticketTypeApi.updateTicketType).mockResolvedValueOnce({} as TicketTypeDTO);

    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText('Deactivate')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Deactivate'));
    
    await waitFor(() => {
      expect(ticketTypeApi.updateTicketType).toHaveBeenCalledWith('1', expect.objectContaining({ isActive: false }));
    });
  });
});

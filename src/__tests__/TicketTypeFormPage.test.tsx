import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { TicketTypeFormPage } from '../pages/admin/TicketTypeFormPage';
import { ticketTypeApi } from '../api/ticketTypeApi';
import { useAuthStore } from '../store/authStore';
import { TicketTypeDTO } from '../types/ticket';

vi.mock('../api/ticketTypeApi');

describe('TicketTypeFormPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ privileges: ['TICKET_TYPE_WRITE'] });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders create mode', () => {
    render(
      <MemoryRouter initialEntries={['/new']}>
        <Routes>
          <Route path="/new" element={<TicketTypeFormPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Create Ticket Type')).toBeInTheDocument();
  });

  it('renders edit mode and loads data', async () => {
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValueOnce({
      id: '1',
      title: 'Edit Test',
      departmentId: 'IT',
      folderId: 'f1',
      formSchema: { fields: [] },
      isActive: true
    });

    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<TicketTypeFormPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Edit Test')).toBeInTheDocument();
    });
  });

  it('handles form submission', async () => {
    vi.mocked(ticketTypeApi.createTicketType).mockResolvedValueOnce({} as TicketTypeDTO);
    
    render(
      <MemoryRouter initialEntries={['/new']}>
        <Routes>
          <Route path="/new" element={<TicketTypeFormPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Type' } });
    fireEvent.change(screen.getByLabelText(/Department ID/i), { target: { value: 'HR' } });
    fireEvent.change(screen.getByLabelText(/Folder ID/i), { target: { value: 'folder2' } });
    
    fireEvent.click(screen.getByText('Save Ticket Type'));
    
    await waitFor(() => {
      expect(ticketTypeApi.createTicketType).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Type',
        departmentId: 'HR',
        folderId: 'folder2'
      }));
    });
  });
});

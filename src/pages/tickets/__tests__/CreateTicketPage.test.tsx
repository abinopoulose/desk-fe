import { ROUTES } from '../../../constants';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateTicketPage } from '../CreateTicketPage';
import { ticketApi } from '../../../api/ticketApi';
import { MemoryRouter, Route, Routes } from 'react-router';

vi.mock('../../../api/ticketApi', () => ({
  ticketApi: {
    getTicketSchema: vi.fn(),
    createTicket: vi.fn(),
  },
}));

const mockSchema = {
  id: 'type-123',
  title: 'Hardware Request',
  description: 'Request new hardware',
  departmentId: 'IT',
  folderId: 'Hardware',
  formSchema: {
    fields: [
      { name: 'device', label: 'Device', type: 'text', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea' }
    ]
  }
};

describe('CreateTicketPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  const renderComponent = (initialEntry = '/tickets/new?typeId=type-123') => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<div data-testid="ticket-detail-page">Detail Page</div>} />
          <Route path="/browse" element={<div data-testid="browse-page">Browse Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders prompt to select type when no typeId is provided', () => {
    renderComponent(ROUTES.TICKETS.NEW);
    expect(screen.getByText('Select a Service Request Type')).toBeInTheDocument();
    expect(screen.getByText('Browse Folders')).toBeInTheDocument();
  });

  it('fetches and renders schema on mount', async () => {
    vi.mocked(ticketApi.getTicketSchema).mockResolvedValue(mockSchema);
    renderComponent();
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Hardware Request')).toBeInTheDocument();
      expect(screen.getByText('Request new hardware')).toBeInTheDocument();
      expect(screen.getByText('New Ticket / IT / Hardware')).toBeInTheDocument();
    });
    
    expect(ticketApi.getTicketSchema).toHaveBeenCalledWith('type-123');
  });

  it('handles API error on schema fetch', async () => {
    vi.mocked(ticketApi.getTicketSchema).mockRejectedValue(new Error('API Error'));
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('allows priority selection', async () => {
    vi.mocked(ticketApi.getTicketSchema).mockResolvedValue(mockSchema);
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Hardware Request')).toBeInTheDocument();
    });
    
    const priority1Btn = screen.getByTestId('priority-1');
    fireEvent.click(priority1Btn);
    
    expect(priority1Btn).toHaveClass('ring-2');
  });

  it('shows required field validation errors from DynamicFormRenderer', async () => {
    vi.mocked(ticketApi.getTicketSchema).mockResolvedValue(mockSchema);
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Hardware Request')).toBeInTheDocument();
    });
    
    const submitBtn = screen.getByRole('button', { name: 'Submit' });
    fireEvent.submit(submitBtn.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  it('opens confirmation modal and submits successfully', async () => {
    vi.mocked(ticketApi.getTicketSchema).mockResolvedValue(mockSchema);
    vi.mocked(ticketApi.createTicket).mockResolvedValue({ id: 'ticket-999' } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Hardware Request')).toBeInTheDocument();
    });
    
    const deviceInput = screen.getByRole('textbox', { name: /Device/i });
    fireEvent.change(deviceInput, { target: { value: 'MacBook Pro' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Submit' });
    fireEvent.submit(submitBtn.closest('form')!);
    
    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Confirm Ticket Details')).toBeInTheDocument();
    });
    
    const confirmBtn = screen.getByTestId('confirm-submit-btn');
    fireEvent.click(confirmBtn);
    
    expect(ticketApi.createTicket).toHaveBeenCalledWith({
      ticketTypeId: 'type-123',
      priority: 3,
      formData: {
        device: 'MacBook Pro',
      }
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('ticket-detail-page')).toBeInTheDocument();
    });
  });

  it('displays backend 400 validation errors', async () => {
    vi.mocked(ticketApi.getTicketSchema).mockResolvedValue(mockSchema);
    vi.mocked(ticketApi.createTicket).mockRejectedValue({
      statusCode: 400,
      details: { device: 'Device is out of stock' }
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Hardware Request')).toBeInTheDocument();
    });
    
    const deviceInput = screen.getByRole('textbox', { name: /Device/i });
    fireEvent.change(deviceInput, { target: { value: 'MacBook Pro' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Submit' });
    fireEvent.submit(submitBtn.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Ticket Details')).toBeInTheDocument();
    });
    
    const confirmBtn = screen.getByTestId('confirm-submit-btn');
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Device is out of stock')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { TicketListPage } from './TicketListPage';
import { ticketApi } from '../../api/ticketApi';

vi.mock('../../api/ticketApi');
vi.mock('../../store/authStore', () => ({
  useAuth: () => ({
    user: { id: 'user-1', fullName: 'Abino Poulose', email: 'abino@abino.in' },
    isSuperAdmin: true,
    hasPrivilege: () => true,
  }),
}));

let mockHasDeptAccess = true;
vi.mock('../../hooks', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useDepartmentAccess: () => ({
      hasDepartmentAccess: mockHasDeptAccess,
      myDepartments: [],
      isLoading: false,
      isInitialized: true,
      canEditAnyDept: false,
      refetch: vi.fn(),
    }),
  };
});

const mockResponse = {
  tickets: [
    {
      id: 'ticket-1',
      displayId: 'IT-1',
      title: 'Laptop issue',
      ticketTypeId: 'type-1',
      ticketTypeTitle: 'IT Support',
      requesterId: 'user-1',
      requesterName: 'Abino Poulose',
      assigneeId: undefined,
      assigneeName: undefined,
      currentStatusId: 'status-1',
      currentStatusName: 'Open',
      mappedState: 'OPEN' as const,
      priority: 2,
      formData: {},
      slaDueAt: '2026-10-18T10:00:00Z',
      slaBreached: false,
      createdAt: '2026-10-17T10:00:00Z',
      updatedAt: '2026-10-17T10:00:00Z',
    },
  ],
  totalElements: 1,
  totalPages: 1,
  currentPage: 0,
};

describe('TicketListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ticketApi.getTickets).mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    cleanup();
    mockHasDeptAccess = true;
    vi.resetAllMocks();
  });

  it('renders My Requests, Assigned to Me, and Shared with Me tabs', async () => {
    render(
      <BrowserRouter>
        <TicketListPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: 'My Requests' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Assigned to Me' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Shared with Me' })).toBeDefined();

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ tab: 'my', requesterId: 'user-1' })
      );
    });
  });

  it('switches to Shared with Me tab and calls ticketApi with tab=shared', async () => {
    render(
      <BrowserRouter>
        <TicketListPage />
      </BrowserRouter>
    );

    const sharedTabBtn = screen.getByRole('button', { name: 'Shared with Me' });
    fireEvent.click(sharedTabBtn);

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ tab: 'shared' })
      );
    });
  });

  it('switches to Assigned to Me tab and calls ticketApi with tab=assigned', async () => {
    render(
      <BrowserRouter>
        <TicketListPage />
      </BrowserRouter>
    );

    const assignedTabBtn = screen.getByRole('button', { name: 'Assigned to Me' });
    fireEvent.click(assignedTabBtn);

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ tab: 'assigned', assigneeId: 'user-1' })
      );
    });
  });

  it('restores chosen filters from URL query parameters when returning via back navigation', async () => {
    const { MemoryRouter } = await import('react-router');
    render(
      <MemoryRouter initialEntries={['/dashboard?tab=assigned&mappedState=OPEN&priority=1&search=laptop']}>
        <TicketListPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search requests by title, reference #, or person...') as HTMLInputElement;
    expect(searchInput.value).toBe('laptop');

    const prioritySelect = screen.getByLabelText('Filter by priority') as HTMLSelectElement;
    expect(prioritySelect.value).toBe('1');

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          tab: 'assigned',
          mappedState: 'OPEN',
          priority: 1,
          search: 'laptop',
        })
      );
    });
  });

  it('renders Department Queue button when user has department access', () => {
    mockHasDeptAccess = true;
    render(
      <BrowserRouter>
        <TicketListPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /department queue/i })).toBeDefined();
  });

  it('does NOT render Department Queue button when user has no department access', () => {
    mockHasDeptAccess = false;
    render(
      <BrowserRouter>
        <TicketListPage />
      </BrowserRouter>
    );

    expect(screen.queryByRole('button', { name: /department queue/i })).toBeNull();
  });
});

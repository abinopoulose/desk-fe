import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { DepartmentTicketsPage } from './DepartmentTicketsPage';
import { departmentApi } from '../../api/departmentApi';
import { ticketApi } from '../../api/ticketApi';

vi.mock('../../api/departmentApi');
vi.mock('../../api/ticketApi');

const mockUser = { id: 'user-123', fullName: 'Alice Specialist', email: 'alice@abino.in' };
vi.mock('../../store/authStore', () => ({
  useAuth: () => ({
    user: mockUser,
    isSuperAdmin: false,
    hasPrivilege: () => false,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useParams: () => ({ departmentId: 'dept-1' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('DepartmentTicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('renders tickets list and allows member to take up pending ticket', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'Technical Support',
        description: 'Tech triage',
        alphaTags: ['TECH'],
        myRole: 'MEMBER',
        memberCount: 8,
      },
    ]);

    vi.mocked(ticketApi.getTickets).mockResolvedValue({
      tickets: [
        {
          id: 'ticket-1',
          displayId: 'TECH-101',
          sequenceNumber: 101,
          title: 'Laptop display flicker',
          ticketType: { title: 'Hardware Issue' },
          priority: 2,
          mappedState: 'OPEN',
          status: { id: 'st-1', name: 'Open', mappedState: 'OPEN' },
          requester: { id: 'req-1', fullName: 'Bob Employee', email: 'bob@abino.in' },
          assignee: null, // Unassigned pending ticket!
          slaBreached: false,
          slaDueAt: '2026-10-25T10:00:00Z',
          createdAt: '2026-10-18T10:00:00Z',
        } as any,
        {
          id: 'ticket-2',
          displayId: 'TECH-102',
          sequenceNumber: 102,
          title: 'VPN cannot connect',
          ticketType: { title: 'Network' },
          priority: 1,
          mappedState: 'OPEN',
          status: { id: 'st-2', name: 'In Progress', mappedState: 'OPEN' },
          requester: { id: 'req-2', fullName: 'Charlie Dev', email: 'charlie@abino.in' },
          assignee: { id: 'user-123', fullName: 'Alice Specialist' },
          slaBreached: true,
          slaDueAt: '2026-10-17T10:00:00Z',
          escalated: true,
          createdAt: '2026-10-17T10:00:00Z',
        } as any,
      ],
      totalElements: 2,
      totalPages: 1,
      currentPage: 0,
    });

    vi.mocked(ticketApi.assignTicket).mockResolvedValue({} as any);

    render(<DepartmentTicketsPage />);

    // Check department name rendered
    await waitFor(() => {
      expect(screen.getAllByText('Technical Support').length).toBeGreaterThan(0);
      expect(screen.getByText('Laptop display flicker')).toBeDefined();
      expect(screen.getByText('VPN cannot connect')).toBeDefined();
    });

    // Check unassigned ticket has "Take Ticket" button
    const takeButton = screen.getByText('Take Ticket');
    expect(takeButton).toBeDefined();

    // Check SLA breached indicator and Escalated tag
    expect(screen.getByText('Breached')).toBeDefined();
    expect(screen.getByText('Escalated')).toBeDefined();

    // Click Take Ticket
    fireEvent.click(takeButton);
    await waitFor(() => {
      expect(ticketApi.assignTicket).toHaveBeenCalledWith('ticket-1', 'user-123');
    });
  });

  it('filters queue by pending unassigned tickets', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'Technical Support',
        description: 'Tech triage',
        alphaTags: ['TECH'],
        myRole: 'MEMBER',
        memberCount: 8,
      },
    ]);

    vi.mocked(ticketApi.getTickets).mockResolvedValue({
      tickets: [],
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
    });

    render(<DepartmentTicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('Pending (Unassigned)')).toBeDefined();
    });

    const pendingFilterBtn = screen.getByText('Pending (Unassigned)');
    fireEvent.click(pendingFilterBtn);

    await waitFor(() => {
      expect(ticketApi.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          departmentId: 'dept-1',
          unassigned: true,
        })
      );
    });
  });
});

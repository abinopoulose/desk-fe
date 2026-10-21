import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TicketManagementCard } from './TicketManagementCard';
import type { TicketStatusDTO } from '../../types/ticket';

describe('TicketManagementCard Component', () => {
  const currentStatus: TicketStatusDTO = {
    id: 'status-open',
    name: 'Open',
    mappedState: 'OPEN',
    displayOrder: 0,
  };

  const inProgressStatus: TicketStatusDTO = {
    id: 'status-in-progress',
    name: 'In Progress',
    mappedState: 'OPEN',
    displayOrder: 1,
  };

  const resolvedStatus: TicketStatusDTO = {
    id: 'status-resolved',
    name: 'Resolved',
    mappedState: 'CLOSED',
    displayOrder: 2,
  };

  const closedStatus: TicketStatusDTO = {
    id: 'status-closed',
    name: 'Closed',
    mappedState: 'CLOSED',
    displayOrder: 3,
  };

  const availableStatuses: TicketStatusDTO[] = [
    currentStatus,
    inProgressStatus,
    resolvedStatus,
    closedStatus,
  ];

  const mockAssignee = {
    id: 'user-1',
    fullName: 'Alice Smith',
    email: 'alice@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all statuses in dropdown when user has full status change permission', () => {
    const handleStatusChange = vi.fn();
    const handleAssigneeChange = vi.fn();

    render(
      <MemoryRouter>
        <TicketManagementCard
          currentStatus={currentStatus}
          assignee={mockAssignee}
          availableStatuses={availableStatuses}
          canChangeStatus={true}
          canCloseTicket={true}
          canManageAssignee={true}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
        />
      </MemoryRouter>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDefined();

    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(options).toHaveLength(4);
    expect(options[0].textContent).toContain('Open (OPEN)');
    expect(options[1].textContent).toContain('In Progress (OPEN)');
    expect(options[2].textContent).toContain('Resolved (CLOSED)');
    expect(options[3].textContent).toContain('Closed (CLOSED)');

    fireEvent.change(select, { target: { value: 'status-in-progress' } });
    expect(handleStatusChange).toHaveBeenCalledTimes(1);
  });

  it('renders only current status and closed statuses when user can only close the ticket', () => {
    const handleStatusChange = vi.fn();
    const handleAssigneeChange = vi.fn();

    render(
      <MemoryRouter>
        <TicketManagementCard
          currentStatus={currentStatus}
          assignee={mockAssignee}
          availableStatuses={availableStatuses}
          canChangeStatus={false}
          canCloseTicket={true}
          canManageAssignee={false}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
        />
      </MemoryRouter>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDefined();

    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    // Should include: Open (current), Resolved (CLOSED), Closed (CLOSED)
    // Should NOT include: In Progress (OPEN)
    expect(options).toHaveLength(3);
    const optionTexts = options.map((opt) => opt.textContent);
    expect(optionTexts).toContain('Open (OPEN)');
    expect(optionTexts).toContain('Resolved (CLOSED)');
    expect(optionTexts).toContain('Closed (CLOSED)');
    expect(optionTexts).not.toContain('In Progress (OPEN)');
  });

  it('renders read-only status badge when user has neither full change nor close permission', () => {
    const handleStatusChange = vi.fn();
    const handleAssigneeChange = vi.fn();

    render(
      <MemoryRouter>
        <TicketManagementCard
          currentStatus={currentStatus}
          assignee={mockAssignee}
          availableStatuses={availableStatuses}
          canChangeStatus={false}
          canCloseTicket={false}
          canManageAssignee={false}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
        />
      </MemoryRouter>
    );

    // No select dropdown rendered
    expect(screen.queryByRole('combobox')).toBeNull();

    // Read-only badge rendered
    expect(screen.getByText('Open')).toBeDefined();
  });

  it('restricts assignee management when canManageAssignee is false', () => {
    const handleStatusChange = vi.fn();
    const handleAssigneeChange = vi.fn();

    render(
      <MemoryRouter>
        <TicketManagementCard
          currentStatus={currentStatus}
          assignee={mockAssignee}
          availableStatuses={availableStatuses}
          canChangeStatus={true}
          canCloseTicket={true}
          canManageAssignee={false}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
        />
      </MemoryRouter>
    );

    // Assignee name is visible
    expect(screen.getByText('Alice Smith')).toBeDefined();
    // Search input or change button shouldn't allow editing
    expect(screen.queryByRole('button', { name: /change assignee/i })).toBeNull();
  });
});

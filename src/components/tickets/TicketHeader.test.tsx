import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TicketHeader } from './TicketHeader';
import type { TicketDetailResponse } from '../../types/ticket';

describe('TicketHeader Component', () => {
  afterEach(() => {
    cleanup();
  });
  const sampleTicket: TicketDetailResponse = {
    id: 'b1234567-0000-0000-0000-000000000000',
    displayId: 'ENG-1',
    title: 'Need EC2 instance for analytics database',
    ticketType: {
      id: 'tt-1',
      title: 'Create EC2',
      alphaTag: 'ENG',
    },
    requester: {
      id: 'USER-1',
      fullName: 'Abino Poulose',
      email: 'abino@example.com',
    },
    currentStatus: {
      id: 'status-1',
      name: 'Open',
      mappedState: 'OPEN',
    },
    priority: 1,
    formData: {},
    slaDueAt: new Date(Date.now() + 3600000).toISOString(),
    slaBreached: false,
    comments: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders ticket title as the main heading and ticket type as category', () => {
    render(
      <MemoryRouter>
        <TicketHeader ticket={sampleTicket} />
      </MemoryRouter>
    );

    // Title is shown as the main heading
    expect(screen.getByRole('heading', { level: 2, name: 'Need EC2 instance for analytics database' })).toBeDefined();

    // Category / ticket type is displayed
    expect(screen.getByText('Create EC2')).toBeDefined();
    expect(screen.getByText('Request Type:')).toBeDefined();

    // Display ID and status are displayed
    expect(screen.getByText('ENG-1')).toBeDefined();
    expect(screen.getByText('Critical')).toBeDefined();
    expect(screen.getByText('Open')).toBeDefined();
  });
});

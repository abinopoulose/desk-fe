import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlaConfigPage } from '../SlaConfigPage';
import { ticketTypeApi } from '../../../api/ticketTypeApi';
import { slaApi } from '../../../api/slaApi';
import { useAuthStore } from '../../../store/authStore';
import { BrowserRouter } from 'react-router';
import type { TicketTypeSummaryDTO } from '../../../types/ticket';
import type { SlaConfigDTO } from '../../../types/sla';

vi.mock('../../../api/ticketTypeApi');
vi.mock('../../../api/slaApi');
vi.mock('../../../store/authStore');

describe('SlaConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue(['SLA_WRITE']);
  });

  it('renders ticket types and SLA configs', async () => {
    vi.mocked(ticketTypeApi.getTicketTypes).mockResolvedValue([{ id: 'tt1', title: 'IT Support' }] as unknown as TicketTypeSummaryDTO[]);
    vi.mocked(slaApi.getSlaConfigs).mockResolvedValue([
      { id: 'sla1', priority: 1, resolutionMinutes: 60, workingDays: [1, 2], workingHoursStart: '09:00:00', workingHoursEnd: '17:00:00', escalationHooks: null }
    ] as unknown as SlaConfigDTO[]);

    render(
      <BrowserRouter>
        <SlaConfigPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('IT Support')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('60')).toBeInTheDocument();
    });
  });
});

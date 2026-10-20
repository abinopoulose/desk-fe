import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MetricsDashboardPage } from './MetricsDashboardPage';
import { metricsApi } from '../../api/metricsApi';
import { departmentApi } from '../../api/departmentApi';
import { getOrgUsers } from '../../api/employeeApi';

vi.mock('../../api/metricsApi');
vi.mock('../../api/departmentApi');
vi.mock('../../api/employeeApi');

const mockMetricsData = {
  totalTickets: 250,
  openTickets: 50,
  closedTickets: 200,
  slaBreachCount: 15,
  slaBreachRate: 6.0,
  averageTatHours: 4.5,
  escalatedCount: 3,
  byPriority: [
    { priority: 1, count: 20 },
    { priority: 2, count: 80 },
    { priority: 3, count: 100 },
    { priority: 4, count: 50 },
  ],
  byDepartment: [
    { departmentId: 'dept-1', departmentName: 'Engineering', count: 250 },
  ],
  byTicketType: [
    { ticketTypeId: 'tt-1', ticketTypeName: 'Bug Report', count: 150, averageTatHours: 3.2 },
    { ticketTypeId: 'tt-2', ticketTypeName: 'Access Request', count: 100, averageTatHours: 1.5 },
  ],
  trend: [
    { date: '2026-10-01', created: 10, closed: 8, netDelta: 2, averageTatHours: 3.5 },
    { date: '2026-10-02', created: 12, closed: 11, netDelta: 1, averageTatHours: 4.0 },
  ],
  agentProductivity: [
    {
      assigneeId: 'agent-1',
      assigneeName: 'Alice Specialist',
      assigneeEmail: 'alice@example.com',
      profilePictureUrl: null,
      assignedTickets: 40,
      resolvedTickets: 36,
      resolutionRate: 90.0,
      averageTatHours: 2.8,
      slaBreachCount: 1,
      escalatedCount: 0,
    },
    {
      assigneeId: 'agent-2',
      assigneeName: 'Bob Engineer',
      assigneeEmail: 'bob@example.com',
      profilePictureUrl: null,
      assignedTickets: 30,
      resolvedTickets: 20,
      resolutionRate: 66.7,
      averageTatHours: 5.4,
      slaBreachCount: 4,
      escalatedCount: 1,
    },
  ],
  backlogAging: {
    lessThan24h: 25,
    oneToThreeDays: 15,
    threeToSevenDays: 6,
    sevenToFourteenDays: 3,
    moreThan14Days: 1,
  },
};

describe('MetricsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(departmentApi.getAllDepartments).mockResolvedValue([
      { id: 'dept-1', name: 'Engineering' } as any,
    ]);

    vi.mocked(getOrgUsers).mockResolvedValue([
      { id: 'agent-1', fullName: 'Alice Specialist', email: 'alice@example.com', roles: ['AGENT'] },
      { id: 'agent-2', fullName: 'Bob Engineer', email: 'bob@example.com', roles: ['AGENT'] },
    ] as any);

    vi.mocked(metricsApi.getPerformanceMetrics).mockResolvedValue(mockMetricsData);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders executive KPI cards and calculated figures accurately', async () => {
    render(<MetricsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Customize Scope & Dimensions')).toBeDefined();
      expect(screen.getByText('250')).toBeDefined(); // Total Inflow
      expect(screen.getByText('50')).toBeDefined(); // Active Backlog
      expect(screen.getByText('200')).toBeDefined(); // Resolved Throughput
      expect(screen.getByText('4.5h')).toBeDefined(); // MTTR
      expect(screen.getByText('94.0%')).toBeDefined(); // SLA compliance (100 - 6.0)
      expect(screen.getByText('3')).toBeDefined(); // Escalated
      expect(screen.getByText('20% of inflow active')).toBeDefined();
      expect(screen.getByText('80% resolution rate')).toBeDefined();
    });

    // Verify absence of hardcoded dummy trends
    expect(screen.queryByText(/vs last period/i)).toBeNull();
    expect(screen.queryByText(/\+12%/)).toBeNull();
    expect(screen.queryByText(/-5%/)).toBeNull();
  });

  it('allows customizing time presets and reveals custom date inputs', async () => {
    render(<MetricsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Time Range/i)).toBeDefined();
    });

    // Click 7D preset
    const btn7d = screen.getByRole('button', { name: '7D' });
    fireEvent.click(btn7d);
    expect(metricsApi.getPerformanceMetrics).toHaveBeenCalled();

    // Click Custom preset
    const btnCustom = screen.getByRole('button', { name: 'Custom' });
    fireEvent.click(btnCustom);

    // Verify custom inputs and Apply button appear
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDefined();
  });

  it('switches chart lenses and visualization modes', async () => {
    render(<MetricsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Fulfillment Velocity & Throughput Trend')).toBeDefined();
    });

    // Switch to Net Delta metric lens
    const netDeltaBtn = screen.getByRole('button', { name: 'Net Delta' });
    fireEvent.click(netDeltaBtn);

    // Switch to TAT metric lens
    const tatBtn = screen.getByRole('button', { name: 'TAT (Hrs)' });
    fireEvent.click(tatBtn);

    // Switch chart visual type to Area
    const areaBtn = screen.getByRole('button', { name: 'area' });
    fireEvent.click(areaBtn);

    // Switch chart visual type to Bar
    const barBtn = screen.getByRole('button', { name: 'bar' });
    fireEvent.click(barBtn);
  });

  it('renders Specialist Productivity Leaderboard with search and 1-click filter', async () => {
    render(<MetricsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Specialist Productivity Leaderboard')).toBeDefined();
      expect(screen.getByText('Alice Specialist')).toBeDefined();
      expect(screen.getByText('Bob Engineer')).toBeDefined();
      expect(screen.getByText('90%')).toBeDefined();
    });

    // Search for Alice
    const searchInput = screen.getByPlaceholderText('Search specialist...');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(screen.getByText('Alice Specialist')).toBeDefined();
    expect(screen.queryByText('Bob Engineer')).toBeNull();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Bob Engineer')).toBeDefined();

    // Click Filter Scope for Alice
    const filterButtons = screen.getAllByRole('button', { name: 'Filter Scope' });
    fireEvent.click(filterButtons[0]);

    // Should add active filter tag
    await waitFor(() => {
      expect(screen.getByText(/Specialist: Alice Specialist/)).toBeDefined();
    });
  });

  it('renders Backlog Aging Distribution brackets', async () => {
    render(<MetricsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Backlog Aging Distribution')).toBeDefined();
      expect(screen.getByText('< 24 Hours')).toBeDefined();
      expect(screen.getByText('1 - 3 Days')).toBeDefined();
      expect(screen.getByText('3 - 7 Days')).toBeDefined();
      expect(screen.getByText('7 - 14 Days')).toBeDefined();
      expect(screen.getByText('> 14 Days (Stale)')).toBeDefined();
      expect(screen.getByText('25 (50%)')).toBeDefined(); // 25 out of 50 open
    });
  });

  it('renders Ticket Type breakdown with counts and MTTR', async () => {
    render(<MetricsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Request Category & Type Breakdown')).toBeDefined();
      expect(screen.getByText('Bug Report')).toBeDefined();
      expect(screen.getByText('Access Request')).toBeDefined();
      expect(screen.getByText(/3\.2 hrs/)).toBeDefined();
    });
  });
});

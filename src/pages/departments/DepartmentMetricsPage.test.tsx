import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DepartmentMetricsPage } from './DepartmentMetricsPage';
import { departmentApi } from '../../api/departmentApi';

vi.mock('../../api/departmentApi');

const mockAdminUser = { id: 'admin-1', fullName: 'Super Manager', email: 'admin@abino.in' };
vi.mock('../../store/authStore', () => ({
  useAuth: () => ({
    user: mockAdminUser,
    isSuperAdmin: true,
    hasPrivilege: () => true,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useParams: () => ({ departmentId: 'dept-1' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('DepartmentMetricsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders department performance and SLA metrics', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'Technical Support',
        description: 'Tech triage',
        alphaTags: ['TECH'],
        myRole: 'ADMIN',
        memberCount: 8,
      },
    ]);

    vi.mocked(departmentApi.getDepartmentMetrics).mockResolvedValue({
      departmentId: 'dept-1',
      departmentName: 'Technical Support',
      totalTickets: 120,
      openTickets: 25,
      closedTickets: 95,
      slaBreachedCount: 4,
      slaComplianceRate: 96.7,
      avgResolutionMinutes: 180, // 3.0 hrs
    });

    render(<DepartmentMetricsPage />);

    await waitFor(() => {
      expect(screen.getByText('Department Performance & SLA Overview')).toBeDefined();
      expect(screen.getByText('120')).toBeDefined(); // Total
      expect(screen.getAllByText('25').length).toBeGreaterThan(0); // Open
      expect(screen.getByText('95')).toBeDefined(); // Closed
      expect(screen.getByText('96.7%')).toBeDefined(); // SLA compliance
      expect(screen.getByText('4')).toBeDefined(); // SLA breaches
      expect(screen.getByText('3.0 hrs')).toBeDefined(); // Avg resolution time
    });

    expect(screen.getByText('Go to Tickets Queue')).toBeDefined();
  });
});

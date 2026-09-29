/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import MetricsDashboardPage from '../../../pages/metrics/MetricsDashboardPage';
import { departmentApi } from '../../../api/departmentApi';
import { metricsApi } from '../../../api/metricsApi';

vi.mock('../../../api/metricsApi', () => ({
  metricsApi: {
    getPerformanceMetrics: vi.fn(),
  },
}));

vi.mock('../../../api/departmentApi', () => ({
  departmentApi: {
    getAllDepartments: vi.fn(),
  },
}));
vi.mock('recharts', () => {
  return {
    LineChart: ({ children }: any) => <div>{children}</div>,
    Line: () => <div />,
    BarChart: ({ children }: any) => <div>{children}</div>,
    Bar: () => <div />,
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: ({ children }: any) => <div>{children}</div>,
    Cell: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe('MetricsDashboardPage', () => {
  const mockMetricsResponse = {
    totalTickets: 150,
    openTickets: 50,
    closedTickets: 100,
    slaBreachCount: 15,
    slaBreachRate: 10.0,
    averageTatHours: 12.5,
    byPriority: [
      { priority: 1, count: 20 },
      { priority: 2, count: 130 }
    ],
    byDepartment: [
      { departmentId: 'd1', departmentName: 'IT', count: 150 }
    ],
    trend: [
      { date: '2023-10-01', created: 5, closed: 3 }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (departmentApi.getAllDepartments as any).mockResolvedValue([
      { id: 'd1', name: 'IT' }, { id: 'd2', name: 'HR' }
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  test('renders loading skeletons initially and fetches data', async () => {
    (metricsApi.getPerformanceMetrics as any).mockReturnValue(
      new Promise((resolve) => setTimeout(() => resolve(mockMetricsResponse), 50))
    );

    render(<MetricsDashboardPage />);

    expect(screen.queryByText('Total Tickets')).not.toBeInTheDocument();

    await screen.findByText('Total Tickets');

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('10.0%')).toBeInTheDocument();
  });

  test('displays error message on fetch failure', async () => {
    (metricsApi.getPerformanceMetrics as any).mockRejectedValue(new Error('Network Error'));

    render(<MetricsDashboardPage />);

    await screen.findByText('Network Error');

    // Retry functionality
    (metricsApi.getPerformanceMetrics as any).mockResolvedValue(mockMetricsResponse);
    fireEvent.click(screen.getByText('Retry'));

    await screen.findByText('150');
  });

  test('applies filters and fetches data', async () => {
    (metricsApi.getPerformanceMetrics as any).mockResolvedValue(mockMetricsResponse);
    render(<MetricsDashboardPage />);

    await screen.findByText('Total Tickets');

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(metricsApi.getPerformanceMetrics).toHaveBeenCalledTimes(2);
  });
});

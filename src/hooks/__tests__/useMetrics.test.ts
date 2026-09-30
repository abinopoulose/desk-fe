import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMetrics } from '../useMetrics';
import { metricsApi } from '../../api/metricsApi';
import type { PerformanceMetricsResponse } from '../../types/metrics';

vi.mock('../../api/metricsApi', () => ({
  metricsApi: {
    getPerformanceMetrics: vi.fn(),
  },
}));

describe('useMetrics hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMetrics: PerformanceMetricsResponse = {
    totalTickets: 100,
    openTickets: 20,
    closedTickets: 80,
    slaBreachCount: 5,
    slaBreachRate: 5,
    averageTatHours: 24,
    trend: [],
    byPriority: [],
    byDepartment: [],
  };

  it('fetches metrics successfully', async () => {
    vi.mocked(metricsApi.getPerformanceMetrics).mockResolvedValueOnce(mockMetrics);

    const { result } = renderHook(() => useMetrics());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual(mockMetrics);
    expect(result.current.error).toBeNull();
    expect(result.current.chartData).toEqual({
      slaData: [
        { name: 'On Time', value: 95 },
        { name: 'Breached', value: 5 },
      ],
    });
  });

  it('handles fetch error', async () => {
    vi.mocked(metricsApi.getPerformanceMetrics).mockRejectedValueOnce(new Error('Fetch failed'));

    const { result } = renderHook(() => useMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Fetch failed');
    expect(result.current.metrics).toBeNull();
    expect(result.current.chartData).toBeNull();
  });

  it('updates filters and refetches', async () => {
    vi.mocked(metricsApi.getPerformanceMetrics).mockResolvedValue(mockMetrics);

    const { result } = renderHook(() => useMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilter('departmentId', 'd1');
    });

    expect(result.current.filters.departmentId).toBe('d1');

    await waitFor(() => {
      expect(metricsApi.getPerformanceMetrics).toHaveBeenCalledWith({ departmentId: 'd1' });
    });
  });

  it('refetches manually', async () => {
    vi.mocked(metricsApi.getPerformanceMetrics).mockResolvedValue(mockMetrics);

    const { result } = renderHook(() => useMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(metricsApi.getPerformanceMetrics).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(metricsApi.getPerformanceMetrics).toHaveBeenCalledTimes(2);
    });
  });
});

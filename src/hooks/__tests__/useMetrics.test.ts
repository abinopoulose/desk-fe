import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
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

  it('fetches metrics successfully', async () => {
    const mockMetrics: PerformanceMetricsResponse = {
      totalTickets: 100,
      openTickets: 20,
      closedTickets: 80,
      slaBreachCount: 5,
      slaBreachRate: 5.0,
      averageTatHours: 4.5,
      byPriority: [{ priority: 1, count: 50 }],
      byDepartment: [{ departmentId: 'd1', departmentName: 'IT', count: 100 }],
      trend: [{ date: '2026-09-29', created: 10, closed: 8 }],
    };
    vi.mocked(metricsApi.getPerformanceMetrics).mockResolvedValueOnce(mockMetrics);

    const { result } = renderHook(() => useMetrics());

    expect(result.current.data).toBeNull();

    await act(async () => {
      const res = await result.current.fetchMetrics({ departmentId: 'd1' });
      expect(res).toEqual(mockMetrics);
    });

    expect(result.current.data).toEqual(mockMetrics);
    expect(result.current.loading).toBe(false);
  });

  it('handles metrics fetch error', async () => {
    vi.mocked(metricsApi.getPerformanceMetrics).mockRejectedValueOnce(new Error('Metrics error'));

    const { result } = renderHook(() => useMetrics());

    await act(async () => {
      try {
        await result.current.fetchMetrics();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Metrics error');
    expect(result.current.loading).toBe(false);
  });
});

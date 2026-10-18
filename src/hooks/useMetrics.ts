import { useState, useCallback, useEffect, useMemo } from 'react';
import { metricsApi } from '../api/metricsApi';
import type { MetricsFilterParams, PerformanceMetricsResponse } from '../types/metrics';
import type { ApiError } from '../utils/apiErrorHandler';

export function useMetrics(initialFilters: MetricsFilterParams = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MetricsFilterParams>(initialFilters);

  const fetchMetrics = useCallback(async (currentFilters: MetricsFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await metricsApi.getPerformanceMetrics(currentFilters);
      setMetrics(data);
    } catch (err) {
      setError((err as ApiError)?.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics(filters);
  }, [filters, fetchMetrics]);

  const handleFilterChange = useCallback((key: keyof MetricsFilterParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' || value === undefined ? undefined : value,
    }));
  }, []);

  const setMultipleFilters = useCallback((updates: Partial<MetricsFilterParams>) => {
    setFilters((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(updates)) {
        if (v === '' || v === undefined) {
          delete (next as any)[k];
        } else {
          (next as any)[k] = v;
        }
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const refetch = useCallback(() => {
    void fetchMetrics(filters);
  }, [filters, fetchMetrics]);

  const chartData = useMemo(() => {
    if (!metrics) return null;
    
    const onTimeCount = Math.max(0, metrics.totalTickets - metrics.slaBreachCount);
    return {
      slaData: [
        { name: 'On Time', value: onTimeCount },
        { name: 'Breached', value: metrics.slaBreachCount }
      ]
    };
  }, [metrics]);

  return {
    metrics,
    chartData,
    loading,
    error,
    filters,
    setFilter: handleFilterChange,
    setMultipleFilters,
    resetFilters,
    refetch,
  };
}

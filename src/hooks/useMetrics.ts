import { useState, useCallback, useEffect, useMemo } from 'react';
import { metricsApi } from '../api/metricsApi';
import type { MetricsFilterParams, PerformanceMetricsResponse } from '../types/metrics';

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
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMetrics(filters);
  }, [filters, fetchMetrics]);

  const handleFilterChange = useCallback((key: keyof MetricsFilterParams, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  }, []);

  const refetch = useCallback(() => {
    void fetchMetrics(filters);
  }, [filters, fetchMetrics]);

  const chartData = useMemo(() => {
    if (!metrics) return null;
    
    const onTimeCount = metrics.totalTickets - metrics.slaBreachCount;
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
    refetch,
  };
}

import { useState, useCallback } from 'react';
import { metricsApi } from '../api/metricsApi';
import type { MetricsFilterParams, PerformanceMetricsResponse } from '../types/metrics';

export function useMetrics() {
  const [data, setData] = useState<PerformanceMetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(
    async (params?: MetricsFilterParams): Promise<PerformanceMetricsResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await metricsApi.getPerformanceMetrics(params);
        setData(response);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch metrics';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    data,
    loading,
    error,
    fetchMetrics,
  };
}

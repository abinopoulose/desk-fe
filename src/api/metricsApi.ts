import axios from 'axios';
import type { MetricsFilterParams, PerformanceMetricsResponse } from '../types/metrics';

const API_BASE_URL = '/api/v1/metrics';

export const metricsApi = {
  getPerformanceMetrics: async (params?: MetricsFilterParams): Promise<PerformanceMetricsResponse> => {
    const response = await axios.get(`${API_BASE_URL}/performance`, { params });
    return response.data;
  },
};

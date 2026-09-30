import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { MetricsFilterParams, PerformanceMetricsResponse } from '../types/metrics';

export const metricsApi = {
  getPerformanceMetrics: async (params?: MetricsFilterParams): Promise<PerformanceMetricsResponse> => {
    const response = await axiosInstance.get(API_PATHS.METRICS.PERFORMANCE, { params });
    return response.data;
  },
};

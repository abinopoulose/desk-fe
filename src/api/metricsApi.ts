import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { MetricsFilterParams, PerformanceMetricsResponse } from '../types/metrics';

const API_BASE_URL = API_PATHS.METRICS.BASE;

export const metricsApi = {
  getPerformanceMetrics: async (params?: MetricsFilterParams): Promise<PerformanceMetricsResponse> => {
    const response = await axiosInstance.get(`${API_BASE_URL}/performance`, { params });
    return response.data;
  },
};

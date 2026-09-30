import { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

export interface ApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}

export const handleApiError = (error: unknown): ApiError => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    const statusCode = axiosError.response?.status || 500;
    const responseData = axiosError.response?.data as Record<string, unknown> | undefined;
    const details = responseData?.details || responseData?.message || responseData;

    let message: string;
    
    if (!axiosError.response) {
      message = 'Network error - please check your connection';
    } else {
      switch (statusCode) {
        case 401:
          message = 'Authentication required';
          useAuthStore.getState().logout();
          break;
        case 403:
          message = 'You do not have permission to perform this action';
          break;
        case 404:
          message = 'The requested resource was not found';
          break;
        case 422:
          message = 'Validation failed';
          break;
        case 500:
          message = 'Internal server error';
          break;
        default:
          message = (responseData?.message as string) || `Error ${statusCode}`;
          break;
      }
    }

    return {
      message,
      statusCode,
      details
    };
  }

  // Already standardized or standard Error object
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return error as ApiError;
  }

  return {
    message: error instanceof Error ? error.message : 'Unknown error',
    statusCode: 500,
    details: error
  };
};

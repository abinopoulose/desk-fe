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
      const serverMessage = typeof responseData?.message === 'string' && responseData.message.trim().length > 0
        ? responseData.message
        : undefined;

      switch (statusCode) {
        case 401: {
          message = serverMessage || 'Authentication required';
          const requestUrl = axiosError.config?.url || '';
          const isAuthEndpoint = requestUrl.includes('/auth/login') ||
                                 requestUrl.includes('/auth/set-password');
          if (!isAuthEndpoint) {
            useAuthStore.getState().logout();
          }
          break;
        }
        case 403:
          message = serverMessage || 'You do not have permission to perform this action';
          break;
        case 404:
          message = serverMessage || 'The requested resource was not found';
          break;
        case 409:
          message = serverMessage || 'Conflict occurred';
          break;
        case 422:
          message = serverMessage || 'Validation failed';
          break;
        case 500:
          message = serverMessage || 'Internal server error';
          break;
        default:
          message = serverMessage || `Error ${statusCode}`;
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

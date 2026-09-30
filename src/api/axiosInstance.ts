import axios from 'axios';
import { handleApiError } from '../utils/apiErrorHandler';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('desk_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const standardizedError = handleApiError(error);
    return Promise.reject(standardizedError);
  }
);

export default axiosInstance;

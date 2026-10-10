import axios from 'axios';
import { handleApiError } from '../utils/apiErrorHandler';
import { useAppStore } from '../store/appStore';
import { getSubdomain } from '../utils/subdomain';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('desk_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const subdomain = getSubdomain();
    if (subdomain && config.headers) {
      config.headers['X-Tenant-Subdomain'] = subdomain;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    useAppStore.getState().setBackendDown(false);
    return response;
  },
  (error) => {
    if (!error.response || error.response.status === 502 || error.response.status === 503 || error.response.status === 504) {
      useAppStore.getState().setBackendDown(true);
    } else {
      useAppStore.getState().setBackendDown(false);
    }
    const standardizedError = handleApiError(error);
    return Promise.reject(standardizedError);
  }
);

export default axiosInstance;

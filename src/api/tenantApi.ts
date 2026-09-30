import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { TenantConfigDTO, UpdateTenantConfigRequest } from '../types/tenant';

export const tenantApi = {
  getTenantConfig: async (): Promise<TenantConfigDTO> => {
    const response = await axiosInstance.get(API_PATHS.TENANT.CONFIG);
    return response.data;
  },

  updateTenantConfig: async (data: UpdateTenantConfigRequest): Promise<TenantConfigDTO> => {
    const response = await axiosInstance.put(API_PATHS.TENANT.CONFIG, data);
    return response.data;
  },
};

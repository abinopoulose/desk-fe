import axiosInstance from './axiosInstance';
import type { TenantConfigDTO, UpdateTenantConfigRequest } from '../types/tenant';

export const tenantApi = {
  getTenantConfig: async (): Promise<TenantConfigDTO> => {
    const response = await axiosInstance.get('/tenant/config');
    return response.data;
  },

  updateTenantConfig: async (data: UpdateTenantConfigRequest): Promise<TenantConfigDTO> => {
    const response = await axiosInstance.put('/tenant/config', data);
    return response.data;
  },
};

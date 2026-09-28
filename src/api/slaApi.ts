import axiosInstance from './axiosInstance';
import type { SlaConfigDTO, CreateSlaConfigRequest, UpdateSlaConfigRequest } from '../types/sla';

export const slaApi = {
  getSlaConfigs: async (ticketTypeId: string): Promise<SlaConfigDTO[]> => {
    const response = await axiosInstance.get(`/ticket-types/${ticketTypeId}/sla-configs`);
    return response.data;
  },

  createSlaConfig: async (ticketTypeId: string, data: CreateSlaConfigRequest): Promise<SlaConfigDTO> => {
    const response = await axiosInstance.post(`/ticket-types/${ticketTypeId}/sla-configs`, data);
    return response.data;
  },

  updateSlaConfig: async (id: string, data: UpdateSlaConfigRequest): Promise<SlaConfigDTO> => {
    const response = await axiosInstance.put(`/sla-configs/${id}`, data);
    return response.data;
  },

  deleteSlaConfig: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/sla-configs/${id}`);
  },
};

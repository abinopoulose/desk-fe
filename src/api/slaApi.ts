import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { SlaConfigDTO, CreateSlaConfigRequest, UpdateSlaConfigRequest } from '../types/sla';

export const slaApi = {
  getSlaConfigs: async (ticketTypeId: string): Promise<SlaConfigDTO[]> => {
    const response = await axiosInstance.get(API_PATHS.TICKET_TYPES.SLA_CONFIGS(ticketTypeId));
    return response.data;
  },

  createSlaConfig: async (ticketTypeId: string, data: CreateSlaConfigRequest): Promise<SlaConfigDTO> => {
    const response = await axiosInstance.post(API_PATHS.TICKET_TYPES.SLA_CONFIGS(ticketTypeId), data);
    return response.data;
  },

  updateSlaConfig: async (id: string, data: UpdateSlaConfigRequest): Promise<SlaConfigDTO> => {
    const response = await axiosInstance.put(API_PATHS.SLA_CONFIGS.BY_ID(id), data);
    return response.data;
  },

  deleteSlaConfig: async (id: string): Promise<void> => {
    await axiosInstance.delete(API_PATHS.SLA_CONFIGS.BY_ID(id));
  },
};

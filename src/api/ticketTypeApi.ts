import axiosInstance from './axiosInstance';
import {
  TicketTypeSummaryDTO,
  TicketTypeDTO,
  CreateTicketTypeRequest,
  UpdateTicketTypeRequest,
  TicketStatusDTO,
  CreateStatusRequest,
  UpdateStatusRequest,
} from '../types/ticket';

export const ticketTypeApi = {
  getTicketTypes: async (includeInactive?: boolean): Promise<TicketTypeSummaryDTO[]> => {
    const params = includeInactive ? { includeInactive } : {};
    const response = await axiosInstance.get('/ticket-types', { params });
    return response.data;
  },

  getTicketTypeById: async (id: string): Promise<TicketTypeDTO> => {
    const response = await axiosInstance.get(`/ticket-types/${id}`);
    return response.data;
  },

  createTicketType: async (data: CreateTicketTypeRequest): Promise<TicketTypeDTO> => {
    const response = await axiosInstance.post('/ticket-types', data);
    return response.data;
  },

  updateTicketType: async (id: string, data: UpdateTicketTypeRequest): Promise<TicketTypeDTO> => {
    const response = await axiosInstance.put(`/ticket-types/${id}`, data);
    return response.data;
  },

  deleteTicketType: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/ticket-types/${id}`);
  },

  getTicketStatuses: async (typeId: string): Promise<TicketStatusDTO[]> => {
    const response = await axiosInstance.get(`/ticket-types/${typeId}/statuses`);
    return response.data;
  },

  createTicketStatus: async (typeId: string, data: CreateStatusRequest): Promise<TicketStatusDTO> => {
    const response = await axiosInstance.post(`/ticket-types/${typeId}/statuses`, data);
    return response.data;
  },

  updateTicketStatus: async (statusId: string, data: UpdateStatusRequest): Promise<TicketStatusDTO> => {
    const response = await axiosInstance.put(`/ticket-statuses/${statusId}`, data);
    return response.data;
  },

  deleteTicketStatus: async (statusId: string): Promise<void> => {
    await axiosInstance.delete(`/ticket-statuses/${statusId}`);
  },
};

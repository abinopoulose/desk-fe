import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type {
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
    const response = await axiosInstance.get(API_PATHS.TICKET_TYPES.BASE, { params });
    return response.data;
  },

  getTicketTypeById: async (id: string): Promise<TicketTypeDTO> => {
    const response = await axiosInstance.get(API_PATHS.TICKET_TYPES.BY_ID(id));
    return response.data;
  },

  createTicketType: async (data: CreateTicketTypeRequest): Promise<TicketTypeDTO> => {
    const response = await axiosInstance.post(API_PATHS.TICKET_TYPES.BASE, data);
    return response.data;
  },

  updateTicketType: async (id: string, data: UpdateTicketTypeRequest): Promise<TicketTypeDTO> => {
    const response = await axiosInstance.put(API_PATHS.TICKET_TYPES.BY_ID(id), data);
    return response.data;
  },

  deleteTicketType: async (id: string): Promise<void> => {
    await axiosInstance.delete(API_PATHS.TICKET_TYPES.BY_ID(id));
  },

  getTicketStatuses: async (typeId: string): Promise<TicketStatusDTO[]> => {
    const response = await axiosInstance.get(API_PATHS.TICKET_TYPES.STATUSES(typeId));
    return response.data;
  },

  createTicketStatus: async (typeId: string, data: CreateStatusRequest): Promise<TicketStatusDTO> => {
    const response = await axiosInstance.post(API_PATHS.TICKET_TYPES.STATUSES(typeId), data);
    return response.data;
  },

  updateTicketStatus: async (statusId: string, data: UpdateStatusRequest): Promise<TicketStatusDTO> => {
    const response = await axiosInstance.put(API_PATHS.TICKET_STATUSES.BY_ID(statusId), data);
    return response.data;
  },

  deleteTicketStatus: async (statusId: string): Promise<void> => {
    await axiosInstance.delete(API_PATHS.TICKET_STATUSES.BY_ID(statusId));
  },
};

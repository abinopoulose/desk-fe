import axiosInstance from './axiosInstance';
import { FormSchemaResponse, CreateTicketRequest, TicketDTO } from '../types/ticket';

export const ticketApi = {
  createTicket: async (request: CreateTicketRequest): Promise<TicketDTO> => {
    const response = await axiosInstance.post<TicketDTO>('/tickets', request);
    return response.data;
  },

  getTicketSchema: async (typeId: string): Promise<FormSchemaResponse> => {
    const response = await axiosInstance.get<FormSchemaResponse>(`/ticket-types/${typeId}/schema`);
    return response.data;
  },
};

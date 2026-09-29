import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { 
  FormSchemaResponse, 
  CreateTicketRequest, 
  TicketDTO, 
  TicketDetailResponse, 
  CommentDTO,
  TicketFilterParams,
  TicketListResponse
} from '../types/ticket';

export const ticketApi = {
  getTickets: async (params: TicketFilterParams): Promise<TicketListResponse> => {
    const response = await axiosInstance.get<TicketListResponse>(API_PATHS.TICKETS.BASE, { params });
    return response.data;
  },

  createTicket: async (request: CreateTicketRequest): Promise<TicketDTO> => {
    const response = await axiosInstance.post<TicketDTO>(API_PATHS.TICKETS.BASE, request);
    return response.data;
  },

  getTicketSchema: async (typeId: string): Promise<FormSchemaResponse> => {
    const response = await axiosInstance.get<FormSchemaResponse>(`/ticket-types/${typeId}/schema`);
    return response.data;
  },

  getTicketDetails: async (ticketId: string): Promise<TicketDetailResponse> => {
    const response = await axiosInstance.get<TicketDetailResponse>(`/tickets/${ticketId}`);
    return response.data;
  },

  updateTicketStatus: async (ticketId: string, statusId: string): Promise<TicketDTO> => {
    const response = await axiosInstance.patch<TicketDTO>(`/tickets/${ticketId}/status`, { statusId });
    return response.data;
  },

  assignTicket: async (ticketId: string, assigneeId: string | null): Promise<TicketDTO> => {
    const response = await axiosInstance.patch<TicketDTO>(`/tickets/${ticketId}/assign`, { assigneeId });
    return response.data;
  },

  addComment: async (ticketId: string, content: string): Promise<CommentDTO> => {
    const response = await axiosInstance.post<CommentDTO>(`/tickets/${ticketId}/comments`, { content });
    return response.data;
  },

  getComments: async (ticketId: string): Promise<CommentDTO[]> => {
    const response = await axiosInstance.get<CommentDTO[]>(`/tickets/${ticketId}/comments`);
    return response.data;
  },
};

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
    const response = await axiosInstance.get<FormSchemaResponse>(API_PATHS.TICKETS.SCHEMA(typeId));
    return response.data;
  },

  getTicketDetails: async (ticketId: string): Promise<TicketDetailResponse> => {
    const response = await axiosInstance.get<TicketDetailResponse>(API_PATHS.TICKETS.BY_ID(ticketId));
    return response.data;
  },

  updateTicketStatus: async (ticketId: string, statusId: string): Promise<TicketDTO> => {
    const response = await axiosInstance.put<TicketDTO>(API_PATHS.TICKETS.STATUS(ticketId), {
      newStatusId: statusId,
      statusId,
    });
    return response.data;
  },

  assignTicket: async (ticketId: string, assigneeId: string | null): Promise<TicketDTO> => {
    const response = await axiosInstance.put<TicketDTO>(API_PATHS.TICKETS.ASSIGN(ticketId), { assigneeId });
    return response.data;
  },

  addComment: async (ticketId: string, content: string): Promise<CommentDTO> => {
    const response = await axiosInstance.post<CommentDTO>(API_PATHS.TICKETS.COMMENTS(ticketId), { content });
    return response.data;
  },

  getComments: async (ticketId: string): Promise<CommentDTO[]> => {
    const response = await axiosInstance.get<CommentDTO[]>(API_PATHS.TICKETS.COMMENTS(ticketId));
    return response.data;
  },

  getTicketAccess: async (ticketId: string): Promise<import('../types/ticket').TicketAccessListDTO> => {
    const response = await axiosInstance.get<import('../types/ticket').TicketAccessListDTO>(API_PATHS.TICKETS.ACCESS(ticketId));
    return response.data;
  },

  shareTicket: async (ticketId: string, request: import('../types/ticket').ShareTicketRequest): Promise<import('../types/ticket').TicketShareDTO> => {
    const response = await axiosInstance.post<import('../types/ticket').TicketShareDTO>(API_PATHS.TICKETS.SHARES(ticketId), request);
    return response.data;
  },

  unshareTicket: async (ticketId: string, shareType: 'USER' | 'DEPARTMENT', targetId: string): Promise<void> => {
    await axiosInstance.delete(API_PATHS.TICKETS.SHARES(ticketId), {
      params: { shareType, targetId }
    });
  },

  requestAccess: async (ticketId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>(API_PATHS.TICKETS.REQUEST_ACCESS(ticketId));
    return response.data;
  },

  escalateTicket: async (ticketId: string): Promise<TicketDetailResponse> => {
    const response = await axiosInstance.post<TicketDetailResponse>(API_PATHS.TICKETS.ESCALATE(ticketId));
    return response.data;
  },
};

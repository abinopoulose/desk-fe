import { useState, useCallback } from 'react';
import { ticketApi } from '../api/ticketApi';
import type { ApiError } from '../utils/apiErrorHandler';
import type {
  TicketListResponse,
  TicketFilterParams,
  CreateTicketRequest,
  TicketDTO,
  TicketDetailResponse,
  CommentDTO,
  FormSchemaResponse,
} from '../types/ticket';

export function useTickets() {
  const [data, setData] = useState<TicketListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (params: TicketFilterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketApi.getTickets(params);
      setData(response);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to fetch tickets';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTicketDetails = useCallback(async (ticketId: string): Promise<TicketDetailResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketApi.getTicketDetails(ticketId);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to fetch ticket details';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (request: CreateTicketRequest): Promise<TicketDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketApi.createTicket(request);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to create ticket';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTicketStatus = useCallback(async (ticketId: string, statusId: string): Promise<TicketDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketApi.updateTicketStatus(ticketId, statusId);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to update ticket status';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignTicket = useCallback(async (ticketId: string, assigneeId: string | null): Promise<TicketDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketApi.assignTicket(ticketId, assigneeId);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to assign ticket';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addComment = useCallback(async (ticketId: string, content: string): Promise<CommentDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketApi.addComment(ticketId, content);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to add comment';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getComments = useCallback(async (ticketId: string): Promise<CommentDTO[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketApi.getComments(ticketId);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to fetch comments';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTicketSchema = useCallback(async (typeId: string): Promise<FormSchemaResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketApi.getTicketSchema(typeId);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to fetch ticket schema';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchTickets,
    getTicketDetails,
    createTicket,
    updateTicketStatus,
    assignTicket,
    addComment,
    getComments,
    getTicketSchema,
  };
}

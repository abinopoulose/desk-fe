import { useState, useCallback } from 'react';
import { ticketTypeApi } from '../api/ticketTypeApi';
import type {
  TicketTypeSummaryDTO,
  TicketTypeDTO,
  CreateTicketTypeRequest,
  UpdateTicketTypeRequest,
} from '../types/ticket';

export function useTicketTypes() {
  const [data, setData] = useState<TicketTypeSummaryDTO[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicketTypes = useCallback(async (includeInactive?: boolean): Promise<TicketTypeSummaryDTO[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketTypeApi.getTicketTypes(includeInactive);
      setData(response);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ticket types';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTicketType = useCallback(async (id: string): Promise<TicketTypeDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketTypeApi.getTicketTypeById(id);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ticket type';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicketType = useCallback(async (req: CreateTicketTypeRequest): Promise<TicketTypeDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketTypeApi.createTicketType(req);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create ticket type';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTicketType = useCallback(async (id: string, req: UpdateTicketTypeRequest): Promise<TicketTypeDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketTypeApi.updateTicketType(id, req);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update ticket type';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTicketType = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await ticketTypeApi.deleteTicketType(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete ticket type';
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
    fetchTicketTypes,
    getTicketType,
    createTicketType,
    updateTicketType,
    deleteTicketType,
  };
}

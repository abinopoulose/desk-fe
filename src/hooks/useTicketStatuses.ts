import { useState, useCallback } from 'react';
import { ticketTypeApi } from '../api/ticketTypeApi';
import type {
  TicketStatusDTO,
  CreateStatusRequest,
  UpdateStatusRequest,
} from '../types/ticket';

export function useTicketStatuses() {
  const [data, setData] = useState<TicketStatusDTO[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = useCallback(async (typeId: string): Promise<TicketStatusDTO[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketTypeApi.getTicketStatuses(typeId);
      setData(response);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ticket statuses';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createStatus = useCallback(
    async (typeId: string, req: CreateStatusRequest): Promise<TicketStatusDTO> => {
      setLoading(true);
      setError(null);
      try {
        const response = await ticketTypeApi.createTicketStatus(typeId, req);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create ticket status';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateStatus = useCallback(
    async (statusId: string, req: UpdateStatusRequest): Promise<TicketStatusDTO> => {
      setLoading(true);
      setError(null);
      try {
        const response = await ticketTypeApi.updateTicketStatus(statusId, req);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update ticket status';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteStatus = useCallback(async (statusId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await ticketTypeApi.deleteTicketStatus(statusId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete ticket status';
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
    fetchStatuses,
    createStatus,
    updateStatus,
    deleteStatus,
  };
}

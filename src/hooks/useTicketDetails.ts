import { useState, useEffect, useCallback, useRef } from 'react';
import { ticketApi } from '../api/ticketApi';
import type { TicketDetailResponse } from '../types/ticket';
import { DEFAULT_CLOSED_STATUS_ID, TICKET_STATUS_LABELS } from '../constants';
import type { ApiError } from '../utils/apiErrorHandler';

export interface UseTicketDetailsReturn {
  ticket: TicketDetailResponse | null;
  loading: boolean;
  error: string | null;
  fetchTicketById: (id?: string) => Promise<TicketDetailResponse | null>;
  fetchTicket: (id?: string) => Promise<TicketDetailResponse | null>;
  refetch: () => Promise<TicketDetailResponse | null>;
  updateStatus: (statusId: string) => Promise<TicketDetailResponse | null>;
  updateTicketStatus: (statusId: string) => Promise<TicketDetailResponse | null>;
  changeStatus: (statusId: string) => Promise<TicketDetailResponse | null>;
  transitionStatus: (statusId: string) => Promise<TicketDetailResponse | null>;
  assignTicket: (assigneeId: string | null) => Promise<TicketDetailResponse | null>;
  updateTicket: (
    updater: Partial<TicketDetailResponse> | ((prev: TicketDetailResponse | null) => TicketDetailResponse | null)
  ) => Promise<TicketDetailResponse | null>;
  setTicket: React.Dispatch<React.SetStateAction<TicketDetailResponse | null>>;
}

export function useTicketDetails(ticketId?: string): UseTicketDetailsReturn {
  const [ticket, setTicket] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(ticketId));
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchTicketById = useCallback(
    async (id?: string): Promise<TicketDetailResponse | null> => {
      const targetId = id || ticketId;
      if (!targetId) {
        if (isMountedRef.current) {
          setTicket(null);
          setLoading(false);
          setError(null);
        }
        return null;
      }

      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await ticketApi.getTicketDetails(targetId);
        if (isMountedRef.current) {
          setTicket(data);
        }
        return data;
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const message = (err as ApiError)?.message || 'Failed to load ticket details';
          setError(message);
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [ticketId]
  );

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (ticketId) {
        try {
          await fetchTicketById(ticketId);
        } catch {
          // Handled in fetchTicketById
        }
      } else if (!ignore) {
        setLoading(false);
        setTicket(null);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [ticketId, fetchTicketById]);

  const refetch = useCallback(() => fetchTicketById(ticketId), [fetchTicketById, ticketId]);

  const updateStatus = useCallback(
    async (statusId: string): Promise<TicketDetailResponse | null> => {
      const targetId = ticketId || ticket?.id;
      if (!targetId || !ticket) return null;

      const prevTicket = ticket;
      const isClosed = statusId === DEFAULT_CLOSED_STATUS_ID || statusId.toLowerCase().includes('close');
      const optimisticStatusName =
        TICKET_STATUS_LABELS[statusId] || (isClosed ? 'Closed' : ticket.currentStatus.name);
      const optimisticMappedState: 'OPEN' | 'CLOSED' = isClosed ? 'CLOSED' : 'OPEN';

      // Optimistic update
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              currentStatus: {
                ...prev.currentStatus,
                id: statusId,
                name: optimisticStatusName,
                mappedState: optimisticMappedState,
              },
            }
          : null
      );

      try {
        await ticketApi.updateTicketStatus(targetId, statusId);
        const updated = await ticketApi.getTicketDetails(targetId);
        if (isMountedRef.current) {
          setTicket(updated);
        }
        return updated;
      } catch (err: unknown) {
        if (isMountedRef.current) {
          setTicket(prevTicket);
          const msg = (err as ApiError)?.message || 'Failed to update status';
          setError(msg);
        }
        throw err;
      }
    },
    [ticketId, ticket]
  );

  const assignTicket = useCallback(
    async (assigneeId: string | null): Promise<TicketDetailResponse | null> => {
      const targetId = ticketId || ticket?.id;
      if (!targetId || !ticket) return null;

      const prevTicket = ticket;

      // Optimistic update
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              assignee: assigneeId ? prev.assignee : undefined,
            }
          : null
      );

      try {
        await ticketApi.assignTicket(targetId, assigneeId);
        const updated = await ticketApi.getTicketDetails(targetId);
        if (isMountedRef.current) {
          setTicket(updated);
        }
        return updated;
      } catch (err: unknown) {
        if (isMountedRef.current) {
          setTicket(prevTicket);
          const msg = (err as ApiError)?.message || 'Failed to reassign ticket';
          setError(msg);
        }
        throw err;
      }
    },
    [ticketId, ticket]
  );

  const updateTicket = useCallback(
    async (
      updater: Partial<TicketDetailResponse> | ((prev: TicketDetailResponse | null) => TicketDetailResponse | null)
    ): Promise<TicketDetailResponse | null> => {
      let updatedValue: TicketDetailResponse | null = null;
      setTicket((prev) => {
        if (typeof updater === 'function') {
          updatedValue = updater(prev);
        } else {
          updatedValue = prev ? { ...prev, ...updater } : null;
        }
        return updatedValue;
      });
      return updatedValue;
    },
    []
  );

  return {
    ticket,
    loading,
    error,
    fetchTicketById,
    fetchTicket: fetchTicketById,
    refetch,
    updateStatus,
    updateTicketStatus: updateStatus,
    changeStatus: updateStatus,
    transitionStatus: updateStatus,
    assignTicket,
    updateTicket,
    setTicket,
  };
}

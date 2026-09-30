import { useState, useCallback, useEffect, useMemo } from 'react';
import { ticketTypeApi } from '../api/ticketTypeApi';
import type { ApiError } from '../utils/apiErrorHandler';
import type {
  TicketTypeSummaryDTO,
  TicketTypeDTO,
  CreateTicketTypeRequest,
  UpdateTicketTypeRequest,
} from '../types/ticket';

export interface UseTicketTypesOptions {
  autoFetch?: boolean;
  includeInactive?: boolean;
}

export function useTicketTypes(options?: UseTicketTypesOptions) {
  const { autoFetch = false, includeInactive = true } = options || {};

  const [data, setData] = useState<TicketTypeSummaryDTO[] | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchTicketTypes = useCallback(async (includeInactiveArg?: boolean): Promise<TicketTypeSummaryDTO[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketTypeApi.getTicketTypes(includeInactiveArg);
      setData(response);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to fetch ticket types';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async (): Promise<TicketTypeSummaryDTO[]> => {
    return fetchTicketTypes(includeInactive);
  }, [fetchTicketTypes, includeInactive]);

  useEffect(() => {
    if (autoFetch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchTicketTypes(includeInactive);
    }
  }, [autoFetch, includeInactive, fetchTicketTypes]);

  const requestDelete = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    setError(null);
    try {
      await ticketTypeApi.deleteTicketType(deleteConfirmId);
      setData((prev) => (prev ? prev.filter((item) => item.id !== deleteConfirmId) : null));
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to delete ticket type';
      setError(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirmId]);

  const getTicketType = useCallback(async (id: string): Promise<TicketTypeDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketTypeApi.getTicketTypeById(id);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to fetch ticket type';
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
      const message = (err as ApiError)?.message || 'Failed to create ticket type';
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
      const message = (err as ApiError)?.message || 'Failed to update ticket type';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTicketType = useCallback(async (id: string, skipConfirm = true): Promise<void> => {
    if (!skipConfirm) {
      setDeleteConfirmId(id);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ticketTypeApi.deleteTicketType(id);
      setData((prev) => (prev ? prev.filter((item) => item.id !== id) : null));
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to delete ticket type';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleActive = useCallback(
    async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        const type = await ticketTypeApi.getTicketTypeById(id);
        await ticketTypeApi.updateTicketType(id, { ...type, isActive: !currentStatus });
        await fetchTicketTypes(includeInactive);
      } catch (error: unknown) {
        console.error('Failed to toggle active status', error);
        const message = (error as ApiError)?.message || 'Failed to toggle active status';
        setError(message);
      }
    },
    [fetchTicketTypes, includeInactive]
  );

  const filteredTypes = useMemo(() => {
    const list = data || [];
    return list.filter((type) => {
      const matchesSearch = type.title.toLowerCase().includes(search.toLowerCase());
      const matchesActive =
        activeFilter === 'all' ? true : activeFilter === 'active' ? type.isActive : !type.isActive;
      return matchesSearch && matchesActive;
    });
  }, [data, search, activeFilter]);

  return {
    data,
    ticketTypes: data || [],
    filteredTypes,
    filteredTicketTypes: filteredTypes,
    loading,
    error,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    deleteConfirmId,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
    fetchTicketTypes,
    refetch,
    loadTicketTypes: refetch,
    handleToggleActive,
    toggleActive: handleToggleActive,
    getTicketType,
    createTicketType,
    updateTicketType,
    deleteTicketType,
  };
}

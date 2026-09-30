import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router';
import { ticketTypeApi } from '../api/ticketTypeApi';
import type {
  TicketTypeDTO,
  TicketStatusDTO,
  CreateStatusRequest,
  UpdateStatusRequest,
} from '../types/ticket';
import { DEFAULT_STATUS_VALUES } from '../constants';
import type { ApiError } from '../utils/apiErrorHandler';

export interface StatusFormState {
  name: string;
  mappedState: 'OPEN' | 'CLOSED';
  color: string;
  description: string;
  isDefault: boolean;
}

export interface UseTicketStatusesReturn {
  ticketType: TicketTypeDTO | null;
  statuses: TicketStatusDTO[];
  data: TicketStatusDTO[] | null;
  loading: boolean;
  error: string | null;
  formState: StatusFormState;
  setFormField: (field: keyof StatusFormState, value: unknown) => void;
  isEditing: boolean;
  isModalOpen: boolean;
  editingStatus: TicketStatusDTO | null;
  startEdit: (status?: TicketStatusDTO) => void;
  openModal: (status?: TicketStatusDTO) => void;
  cancelEdit: () => void;
  closeModal: () => void;
  save: (e?: React.FormEvent) => Promise<TicketStatusDTO | null>;
  handleSave: (e?: React.FormEvent) => Promise<TicketStatusDTO | null>;
  remove: (statusId: string, skipConfirm?: boolean) => Promise<void>;
  handleDelete: (statusId: string) => Promise<void>;
  handleMove: (index: number, direction: 'up' | 'down') => Promise<void>;
  moveStatus: (index: number, direction: 'up' | 'down') => Promise<void>;
  refetch: () => Promise<TicketStatusDTO[]>;
  fetchStatuses: (typeId?: string) => Promise<TicketStatusDTO[]>;
  createStatus: (typeId: string, req: CreateStatusRequest) => Promise<TicketStatusDTO>;
  updateStatus: (statusId: string, req: UpdateStatusRequest) => Promise<TicketStatusDTO>;
  deleteStatus: (statusId: string) => Promise<void>;
}

export function useTicketStatuses(typeIdProp?: string): UseTicketStatusesReturn {
  let routeId: string | undefined;
  try {
    const params = useParams<{ id?: string }>();
    routeId = params?.id;
  } catch {
    routeId = undefined;
  }
  const typeId = typeIdProp ?? routeId;

  const [ticketType, setTicketType] = useState<TicketTypeDTO | null>(null);
  const [statuses, setStatuses] = useState<TicketStatusDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(typeId));
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingStatus, setEditingStatus] = useState<TicketStatusDTO | null>(null);
  const [formState, setFormState] = useState<StatusFormState>({
    name: DEFAULT_STATUS_VALUES.name,
    mappedState: DEFAULT_STATUS_VALUES.mappedState,
    color: DEFAULT_STATUS_VALUES.color,
    description: DEFAULT_STATUS_VALUES.description,
    isDefault: DEFAULT_STATUS_VALUES.isDefault,
  });

  const setFormField = useCallback((field: keyof StatusFormState, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const startEdit = useCallback((status?: TicketStatusDTO) => {
    if (status) {
      setEditingStatus(status);
      setIsEditing(true);
      setFormState({
        name: status.name,
        mappedState: status.mappedState,
        color: DEFAULT_STATUS_VALUES.color,
        description: DEFAULT_STATUS_VALUES.description,
        isDefault: DEFAULT_STATUS_VALUES.isDefault,
      });
    } else {
      setEditingStatus(null);
      setIsEditing(false);
      setFormState({
        name: DEFAULT_STATUS_VALUES.name,
        mappedState: DEFAULT_STATUS_VALUES.mappedState,
        color: DEFAULT_STATUS_VALUES.color,
        description: DEFAULT_STATUS_VALUES.description,
        isDefault: DEFAULT_STATUS_VALUES.isDefault,
      });
    }
    setIsModalOpen(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingStatus(null);
    setFormState({
      name: DEFAULT_STATUS_VALUES.name,
      mappedState: DEFAULT_STATUS_VALUES.mappedState,
      color: DEFAULT_STATUS_VALUES.color,
      description: DEFAULT_STATUS_VALUES.description,
      isDefault: DEFAULT_STATUS_VALUES.isDefault,
    });
  }, []);

  const fetchStatuses = useCallback(
    async (id?: string): Promise<TicketStatusDTO[]> => {
      const idToUse = id ?? typeId;
      if (!idToUse) {
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const statusesData = await ticketTypeApi.getTicketStatuses(idToUse);
        const sorted = [...statusesData].sort((a, b) => a.displayOrder - b.displayOrder);
        setStatuses(sorted);

        if (typeof ticketTypeApi.getTicketTypeById === 'function') {
          try {
            const typeData = await ticketTypeApi.getTicketTypeById(idToUse);
            setTicketType(typeData);
          } catch {
            // Optional ticket type metadata
          }
        }

        return sorted;
      } catch (err: unknown) {
        const message = (err as ApiError)?.message || 'Failed to fetch ticket statuses';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [typeId]
  );

  useEffect(() => {
    if (typeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchStatuses(typeId).catch(() => {
        // Error is set in fetchStatuses
      });
    }
  }, [typeId, fetchStatuses]);

  const createStatus = useCallback(
    async (targetTypeId: string, req: CreateStatusRequest): Promise<TicketStatusDTO> => {
      setLoading(true);
      setError(null);
      try {
        const response = await ticketTypeApi.createTicketStatus(targetTypeId, req);
        return response;
      } catch (err: unknown) {
        const message = (err as ApiError)?.message || 'Failed to create ticket status';
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
        const message = (err as ApiError)?.message || 'Failed to update ticket status';
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
      const message = (err as ApiError)?.message || 'Failed to delete ticket status';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async (): Promise<TicketStatusDTO[]> => {
    if (typeId) {
      try {
        return await fetchStatuses(typeId);
      } catch {
        return statuses;
      }
    }
    return statuses;
  }, [typeId, fetchStatuses, statuses]);

  const save = useCallback(
    async (e?: React.FormEvent): Promise<TicketStatusDTO | null> => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      setLoading(true);
      setError(null);
      try {
        let result: TicketStatusDTO;
        if (editingStatus) {
          result = await ticketTypeApi.updateTicketStatus(editingStatus.id, {
            name: formState.name,
            mappedState: formState.mappedState,
            displayOrder: editingStatus.displayOrder,
          });
        } else {
          result = await ticketTypeApi.createTicketStatus(typeId || '', {
            name: formState.name,
            mappedState: formState.mappedState,
            displayOrder: statuses.length,
          });
        }
        cancelEdit();
        if (typeId) {
          await fetchStatuses(typeId);
        }
        return result;
      } catch (err: unknown) {
        console.error('Failed to save status', err);
        setError('Failed to save status.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [editingStatus, formState, typeId, statuses.length, cancelEdit, fetchStatuses]
  );

  const remove = useCallback(
    async (statusId: string, skipConfirm = false): Promise<void> => {
      if (!skipConfirm && typeof window !== 'undefined' && window.confirm) {
        if (!window.confirm('Are you sure you want to delete this status?')) {
          return;
        }
      }
      setLoading(true);
      setError(null);
      try {
        await ticketTypeApi.deleteTicketStatus(statusId);
        if (typeId) {
          await fetchStatuses(typeId);
        }
      } catch (err: unknown) {
        console.error('Failed to delete status', err);
        setError('Failed to delete status.');
      } finally {
        setLoading(false);
      }
    },
    [typeId, fetchStatuses]
  );

  const handleMove = useCallback(
    async (index: number, direction: 'up' | 'down'): Promise<void> => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === statuses.length - 1) return;

      const newStatuses = [...statuses];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;

      // Swap locally
      [newStatuses[index], newStatuses[swapIndex]] = [newStatuses[swapIndex], newStatuses[index]];

      // Update display orders
      newStatuses[index].displayOrder = index;
      newStatuses[swapIndex].displayOrder = swapIndex;
      setStatuses(newStatuses);

      // Save to backend
      try {
        await Promise.all([
          ticketTypeApi.updateTicketStatus(newStatuses[index].id, {
            name: newStatuses[index].name,
            mappedState: newStatuses[index].mappedState,
            displayOrder: newStatuses[index].displayOrder,
          }),
          ticketTypeApi.updateTicketStatus(newStatuses[swapIndex].id, {
            name: newStatuses[swapIndex].name,
            mappedState: newStatuses[swapIndex].mappedState,
            displayOrder: newStatuses[swapIndex].displayOrder,
          }),
        ]);
      } catch (err: unknown) {
        console.error('Failed to update orders', err);
        setError('Failed to update orders.');
        if (typeId) {
          void fetchStatuses(typeId); // Revert on failure
        }
      }
    },
    [statuses, typeId, fetchStatuses]
  );

  return {
    ticketType,
    statuses,
    data: statuses,
    loading,
    error,
    formState,
    setFormField,
    isEditing,
    isModalOpen,
    editingStatus,
    startEdit,
    openModal: startEdit,
    cancelEdit,
    closeModal: cancelEdit,
    save,
    handleSave: save,
    remove,
    handleDelete: remove,
    handleMove,
    moveStatus: handleMove,
    refetch,
    fetchStatuses,
    createStatus,
    updateStatus,
    deleteStatus,
  };
}

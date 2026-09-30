import { useState, useCallback } from 'react';
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
import { useCrud } from './useCrud';

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
    const params = useParams<{ id: string }>();
    routeId = params.id;
  } catch {
    routeId = undefined;
  }

  const typeId = typeIdProp || routeId;
  const [ticketType, setTicketType] = useState<TicketTypeDTO | null>(null);

  const crud = useCrud<TicketStatusDTO, StatusFormState>({
    autoFetch: !!typeId,
    fetchAll: async () => {
      if (!typeId) return [];
      const statusesData = await ticketTypeApi.getTicketStatuses(typeId);
      const sorted = [...statusesData].sort((a, b) => a.displayOrder - b.displayOrder);
      
      if (typeof ticketTypeApi.getTicketTypeById === 'function') {
        try {
          const typeData = await ticketTypeApi.getTicketTypeById(typeId);
          setTicketType(typeData);
        } catch {
          // Optional
        }
      }
      return sorted;
    },
    create: (data) => ticketTypeApi.createTicketStatus(typeId || '', data),
    update: (id, data) => ticketTypeApi.updateTicketStatus(id, data),
    remove: ticketTypeApi.deleteTicketStatus,
    defaultFormState: {
      name: DEFAULT_STATUS_VALUES.name,
      mappedState: DEFAULT_STATUS_VALUES.mappedState,
      color: DEFAULT_STATUS_VALUES.color,
      description: DEFAULT_STATUS_VALUES.description,
      isDefault: DEFAULT_STATUS_VALUES.isDefault,
    },
    mapEntityToFormState: (status) => ({
      name: status.name,
      mappedState: status.mappedState,
      color: DEFAULT_STATUS_VALUES.color,
      description: DEFAULT_STATUS_VALUES.description,
      isDefault: DEFAULT_STATUS_VALUES.isDefault,
    }),
    mapFormStateToPayload: (formState) => ({
      name: formState.name,
      mappedState: formState.mappedState,
      // For create, displayOrder needs to be statuses.length, but we don't have access to statuses here directly
      // So we handle it in `save` wrapper below if needed! Wait, actually `save` wrapper is easier.
      // But we must return something here:
      displayOrder: 0, 
    }),
    getId: (status) => status.id,
  });

  const save = useCallback(
    async (e?: React.FormEvent): Promise<TicketStatusDTO | null> => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      crud.setLoading(true);
      crud.setError(null);
      try {
        let result: TicketStatusDTO;
        if (crud.isEditing && crud.editingItem) {
          result = await ticketTypeApi.updateTicketStatus(crud.editingItem.id, {
            name: crud.formState.name,
            mappedState: crud.formState.mappedState,
            displayOrder: crud.editingItem.displayOrder,
          });
        } else {
          result = await ticketTypeApi.createTicketStatus(typeId || '', {
            name: crud.formState.name,
            mappedState: crud.formState.mappedState,
            displayOrder: crud.items.length,
          });
        }
        crud.cancelEdit();
        if (typeId) {
          await crud.refetch();
        }
        return result;
      } catch (err: unknown) {
        console.error('Failed to save status', err);
        crud.setError('Failed to save status.');
        return null;
      } finally {
        crud.setLoading(false);
      }
    },
    [crud.isEditing, crud.editingItem, crud.formState, typeId, crud.items.length, crud.cancelEdit, crud.refetch, crud.setLoading, crud.setError]
  );

  const remove = useCallback(
    async (statusId: string, skipConfirm = false): Promise<void> => {
      if (!skipConfirm && typeof window !== 'undefined' && window.confirm) {
        if (!window.confirm('Are you sure you want to delete this status?')) {
          return;
        }
      }
      crud.setLoading(true);
      crud.setError(null);
      try {
        await ticketTypeApi.deleteTicketStatus(statusId);
        if (typeId) {
          await crud.refetch();
        }
      } catch (err: unknown) {
        console.error('Failed to delete status', err);
        crud.setError('Failed to delete status.');
      } finally {
        crud.setLoading(false);
      }
    },
    [typeId, crud.refetch, crud.setLoading, crud.setError]
  );

  const handleMove = useCallback(
    async (index: number, direction: 'up' | 'down'): Promise<void> => {
      const statuses = crud.items;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === statuses.length - 1) return;

      const newStatuses = [...statuses];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;

      [newStatuses[index], newStatuses[swapIndex]] = [newStatuses[swapIndex], newStatuses[index]];

      newStatuses[index].displayOrder = index;
      newStatuses[swapIndex].displayOrder = swapIndex;
      
      // We manually update local state since we don't have a crud.setItems exposed for array manipulation like this
      // Actually we exposed setItems!
      crud.setItems(newStatuses);

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
        crud.setError('Failed to update orders.');
        if (typeId) {
          void crud.refetch();
        }
      }
    },
    [crud.items, typeId, crud.refetch, crud.setItems, crud.setError]
  );

  const fetchStatuses = useCallback(
    async (id?: string): Promise<TicketStatusDTO[]> => {
      const idToUse = id ?? typeId;
      if (!idToUse) return [];
      crud.setLoading(true);
      crud.setError(null);
      try {
        const statusesData = await ticketTypeApi.getTicketStatuses(idToUse);
        const sorted = [...statusesData].sort((a, b) => a.displayOrder - b.displayOrder);
        crud.setItems(sorted);
        
        if (typeof ticketTypeApi.getTicketTypeById === 'function') {
          try {
            const typeData = await ticketTypeApi.getTicketTypeById(idToUse);
            setTicketType(typeData);
          } catch {
            // Optional
          }
        }
        return sorted;
      } catch (err: unknown) {
        const message = (err as ApiError)?.message || 'Failed to fetch ticket statuses';
        crud.setError(message);
        throw err;
      } finally {
        crud.setLoading(false);
      }
    },
    [typeId, crud.setLoading, crud.setError, crud.setItems]
  );

  return {
    ticketType,
    statuses: crud.items,
    data: crud.items,
    loading: crud.loading,
    error: crud.error,
    formState: crud.formState,
    setFormField: crud.setFormField,
    isEditing: crud.isEditing,
    isModalOpen: crud.isModalOpen,
    editingStatus: crud.editingItem,
    startEdit: crud.startEdit,
    openModal: crud.startEdit,
    cancelEdit: crud.cancelEdit,
    closeModal: crud.cancelEdit,
    save,
    handleSave: save,
    remove,
    handleDelete: remove,
    handleMove,
    moveStatus: handleMove,
    refetch: crud.refetch,
    fetchStatuses,
    createStatus: ticketTypeApi.createTicketStatus,
    updateStatus: ticketTypeApi.updateTicketStatus,
    deleteStatus: ticketTypeApi.deleteTicketStatus,
  };
}

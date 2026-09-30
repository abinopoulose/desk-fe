import { useCallback } from 'react';
import { slaApi } from '../api/slaApi';
import type { SlaConfigDTO, CreateSlaConfigRequest, UpdateSlaConfigRequest } from '../types/sla';
import { useCrud } from './useCrud';
import type { ApiError } from '../utils/apiErrorHandler';

export interface SlaFormState {
  priority: number;
  resolutionMinutes: number;
  workingDays: number[];
  workingHoursStart: string;
  workingHoursEnd: string;
  escalationHooks: string;
}

const DEFAULT_SLA_FORM_VALUES: SlaFormState = {
  priority: 1,
  resolutionMinutes: 60,
  workingDays: [1, 2, 3, 4, 5],
  workingHoursStart: '09:00:00',
  workingHoursEnd: '17:00:00',
  escalationHooks: '',
};

export function useSla(ticketTypeId?: string) {
  const crud = useCrud<SlaConfigDTO, SlaFormState>({
    autoFetch: !!ticketTypeId,
    fetchAll: () => ticketTypeId ? slaApi.getSlaConfigs(ticketTypeId) : Promise.resolve([]),
    create: (data: CreateSlaConfigRequest) => slaApi.createSlaConfig(ticketTypeId || '', data),
    update: (id: string, data: UpdateSlaConfigRequest) => slaApi.updateSlaConfig(id, data),
    remove: slaApi.deleteSlaConfig,
    defaultFormState: DEFAULT_SLA_FORM_VALUES,
    mapEntityToFormState: (sla) => ({
      priority: sla.priority,
      resolutionMinutes: sla.resolutionMinutes,
      workingDays: [...sla.workingDays],
      workingHoursStart: sla.workingHoursStart,
      workingHoursEnd: sla.workingHoursEnd,
      escalationHooks: sla.escalationHooks ? JSON.stringify(sla.escalationHooks, null, 2) : '',
    }),
    mapFormStateToPayload: (formState) => {
      let parsedHooks = undefined;
      if (formState.escalationHooks) {
        try {
          parsedHooks = JSON.parse(formState.escalationHooks);
        } catch (e) {
          // ignore
        }
      }
      return {
        priority: formState.priority,
        resolutionMinutes: formState.resolutionMinutes,
        workingDays: formState.workingDays,
        workingHoursStart: formState.workingHoursStart,
        workingHoursEnd: formState.workingHoursEnd,
        escalationHooks: parsedHooks,
      };
    },
    getId: (sla) => sla.id,
  });

  const toggleWorkingDay = useCallback((dayValue: number) => {
    crud.setFormState((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(dayValue)
        ? prev.workingDays.filter((d) => d !== dayValue)
        : [...prev.workingDays, dayValue]
    }));
  }, [crud.setFormState]);

  return {
    configs: crud.items,
    data: crud.items.length > 0 ? crud.items : null, // Backwards compat
    loading: crud.loading,
    error: crud.error,
    formState: crud.formState,
    setFormField: crud.setFormField,
    setFormState: crud.setFormState,
    toggleWorkingDay,
    isEditing: crud.isEditing,
    editingConfig: crud.editingItem,
    startEdit: crud.startEdit,
    cancelEdit: crud.cancelEdit,
    save: crud.save,
    remove: crud.remove,
    refetch: crud.refetch,
    
    // Backwards compat wrappers
    fetchSlaConfigs: async (id: string) => {
      crud.setLoading(true);
      crud.setError(null);
      try {
        const response = await slaApi.getSlaConfigs(id);
        crud.setItems(response);
        return response;
      } catch (err: unknown) {
        const message = (err as ApiError)?.message || 'Failed to fetch SLA configs';
        crud.setError(message);
        throw err;
      } finally {
        crud.setLoading(false);
      }
    },
    createSlaConfig: slaApi.createSlaConfig,
    updateSlaConfig: slaApi.updateSlaConfig,
    deleteSlaConfig: slaApi.deleteSlaConfig,
  };
}

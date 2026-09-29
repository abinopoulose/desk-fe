import { useState, useCallback } from 'react';
import { slaApi } from '../api/slaApi';
import type {
  SlaConfigDTO,
  CreateSlaConfigRequest,
  UpdateSlaConfigRequest,
} from '../types/sla';

export function useSla() {
  const [data, setData] = useState<SlaConfigDTO[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlaConfigs = useCallback(async (ticketTypeId: string): Promise<SlaConfigDTO[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await slaApi.getSlaConfigs(ticketTypeId);
      setData(response);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch SLA configs';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSlaConfig = useCallback(
    async (ticketTypeId: string, req: CreateSlaConfigRequest): Promise<SlaConfigDTO> => {
      setLoading(true);
      setError(null);
      try {
        const response = await slaApi.createSlaConfig(ticketTypeId, req);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create SLA config';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateSlaConfig = useCallback(
    async (id: string, req: UpdateSlaConfigRequest): Promise<SlaConfigDTO> => {
      setLoading(true);
      setError(null);
      try {
        const response = await slaApi.updateSlaConfig(id, req);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update SLA config';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteSlaConfig = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await slaApi.deleteSlaConfig(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete SLA config';
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
    fetchSlaConfigs,
    createSlaConfig,
    updateSlaConfig,
    deleteSlaConfig,
  };
}

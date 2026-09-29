import { useState, useCallback } from 'react';
import { tenantApi } from '../api/tenantApi';
import type { TenantConfigDTO, UpdateTenantConfigRequest } from '../types/tenant';

export function useTenantConfig() {
  const [data, setData] = useState<TenantConfigDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenantConfig = useCallback(async (): Promise<TenantConfigDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await tenantApi.getTenantConfig();
      setData(response);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tenant config';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTenantConfig = useCallback(
    async (req: UpdateTenantConfigRequest): Promise<TenantConfigDTO> => {
      setLoading(true);
      setError(null);
      try {
        const response = await tenantApi.updateTenantConfig(req);
        setData(response);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update tenant config';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    data,
    loading,
    error,
    fetchTenantConfig,
    updateTenantConfig,
  };
}

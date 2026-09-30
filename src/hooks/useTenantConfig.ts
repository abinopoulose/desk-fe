import { useState, useCallback, useEffect } from 'react';
import { tenantApi } from '../api/tenantApi';
import type { TenantConfigDTO, UpdateTenantConfigRequest } from '../types/tenant';

export const NOTIFICATION_MESSAGES = {
  SAVE_SUCCESS: 'Tenant configuration saved successfully.',
  SAVE_ERROR: 'Failed to save tenant configuration.',
  LOAD_ERROR: 'Failed to load tenant config',
};

export const useTenantConfig = () => {
  const [config, setConfig] = useState<TenantConfigDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenantConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tenantApi.getTenantConfig();
      setConfig(response);
    } catch (err) {
      console.error(NOTIFICATION_MESSAGES.LOAD_ERROR, err);
      setError(NOTIFICATION_MESSAGES.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTenantConfig();
  }, [fetchTenantConfig]);

  const updateConfig = async (updateData: UpdateTenantConfigRequest) => {
    setSaving(true);
    setError(null);
    try {
      const updatedConfig = await tenantApi.updateTenantConfig(updateData);
      setConfig(updatedConfig);
      alert(NOTIFICATION_MESSAGES.SAVE_SUCCESS);
      return true;
    } catch (err) {
      console.error(NOTIFICATION_MESSAGES.SAVE_ERROR, err);
      setError(NOTIFICATION_MESSAGES.SAVE_ERROR);
      alert(NOTIFICATION_MESSAGES.SAVE_ERROR);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    loading,
    saving,
    error,
    updateConfig,
    refetch: fetchTenantConfig,
  };
};

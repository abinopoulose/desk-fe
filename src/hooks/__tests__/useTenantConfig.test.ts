import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTenantConfig, NOTIFICATION_MESSAGES } from '../useTenantConfig';
import { tenantApi } from '../../api/tenantApi';
import type { TenantConfigDTO } from '../../types/tenant';

vi.mock('../../api/tenantApi', () => ({
  tenantApi: {
    getTenantConfig: vi.fn(),
    updateTenantConfig: vi.fn(),
  },
}));

describe('useTenantConfig hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('fetches tenant config automatically on mount', async () => {
    const mockConfig: TenantConfigDTO = {
      id: 'tenant-1',
      allowedDomains: ['example.com'],
      superAdminEmail: 'admin@example.com',
    };
    vi.mocked(tenantApi.getTenantConfig).mockResolvedValueOnce(mockConfig);

    const { result } = renderHook(() => useTenantConfig());

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.error).toBeNull();
  });

  it('updates tenant config successfully', async () => {
    const mockConfig: TenantConfigDTO = {
      id: 'tenant-1',
      allowedDomains: ['example.com'],
      superAdminEmail: 'admin@example.com',
    };
    const updatedConfig: TenantConfigDTO = {
      id: 'tenant-1',
      allowedDomains: ['example.com', 'test.com'],
      superAdminEmail: 'admin@example.com',
    };
    vi.mocked(tenantApi.getTenantConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(tenantApi.updateTenantConfig).mockResolvedValueOnce(updatedConfig);

    const { result } = renderHook(() => useTenantConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const success = await result.current.updateConfig({
        allowedDomains: ['example.com', 'test.com'],
        superAdminEmail: 'admin@example.com',
      });
      expect(success).toBe(true);
    });

    expect(result.current.config).toEqual(updatedConfig);
    expect(result.current.saving).toBe(false);
    expect(window.alert).toHaveBeenCalledWith(NOTIFICATION_MESSAGES.SAVE_SUCCESS);
  });

  it('handles error on fetch', async () => {
    vi.mocked(tenantApi.getTenantConfig).mockRejectedValueOnce(new Error('Fetch error'));

    const { result } = renderHook(() => useTenantConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(NOTIFICATION_MESSAGES.LOAD_ERROR);
    expect(console.error).toHaveBeenCalled();
  });
  
  it('handles error on update', async () => {
    const mockConfig: TenantConfigDTO = {
      id: 'tenant-1',
      allowedDomains: ['example.com'],
      superAdminEmail: 'admin@example.com',
    };
    vi.mocked(tenantApi.getTenantConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(tenantApi.updateTenantConfig).mockRejectedValueOnce(new Error('Update error'));

    const { result } = renderHook(() => useTenantConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const success = await result.current.updateConfig({
        allowedDomains: ['test.com'],
        superAdminEmail: 'admin@example.com',
      });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe(NOTIFICATION_MESSAGES.SAVE_ERROR);
    expect(result.current.saving).toBe(false);
    expect(window.alert).toHaveBeenCalledWith(NOTIFICATION_MESSAGES.SAVE_ERROR);
    expect(console.error).toHaveBeenCalled();
  });
});

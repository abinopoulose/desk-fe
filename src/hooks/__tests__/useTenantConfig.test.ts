import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTenantConfig } from '../useTenantConfig';
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
  });

  it('fetches tenant config successfully', async () => {
    const mockConfig: TenantConfigDTO = {
      id: 'tenant-1',
      allowedDomains: ['example.com'],
      superAdminEmail: 'admin@example.com',
    };
    vi.mocked(tenantApi.getTenantConfig).mockResolvedValueOnce(mockConfig);

    const { result } = renderHook(() => useTenantConfig());

    expect(result.current.data).toBeNull();

    await act(async () => {
      const res = await result.current.fetchTenantConfig();
      expect(res).toEqual(mockConfig);
    });

    expect(result.current.data).toEqual(mockConfig);
    expect(result.current.loading).toBe(false);
  });

  it('updates tenant config successfully', async () => {
    const mockConfig: TenantConfigDTO = {
      id: 'tenant-1',
      allowedDomains: ['example.com', 'test.com'],
      superAdminEmail: 'admin@example.com',
    };
    vi.mocked(tenantApi.updateTenantConfig).mockResolvedValueOnce(mockConfig);

    const { result } = renderHook(() => useTenantConfig());

    await act(async () => {
      const res = await result.current.updateTenantConfig({
        allowedDomains: ['example.com', 'test.com'],
        superAdminEmail: 'admin@example.com',
      });
      expect(res).toEqual(mockConfig);
    });

    expect(result.current.data).toEqual(mockConfig);
    expect(result.current.loading).toBe(false);
  });

  it('handles error on fetch', async () => {
    vi.mocked(tenantApi.getTenantConfig).mockRejectedValueOnce(new Error('Tenant error'));

    const { result } = renderHook(() => useTenantConfig());

    await act(async () => {
      try {
        await result.current.fetchTenantConfig();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Tenant error');
    expect(result.current.loading).toBe(false);
  });
});

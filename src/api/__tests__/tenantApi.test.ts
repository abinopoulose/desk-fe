import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantApi } from '../tenantApi';
import axiosInstance from '../axiosInstance';
import type { UpdateTenantConfigRequest } from '../../types/tenant';

vi.mock('../axiosInstance');

describe('tenantApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches tenant config', async () => {
    const mockData = { id: 't1', allowedDomains: ['test.com'], superAdminEmail: 'admin@test.com' };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });
    const result = await tenantApi.getTenantConfig();
    expect(result).toEqual(mockData);
    expect(axiosInstance.get).toHaveBeenCalledWith('/tenant/config');
  });

  it('updates tenant config', async () => {
    const mockData: UpdateTenantConfigRequest = { allowedDomains: ['new.com'], superAdminEmail: 'new@test.com' };
    const mockRes = { id: 't1', ...mockData };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: mockRes });
    const result = await tenantApi.updateTenantConfig(mockData);
    expect(result).toEqual(mockRes);
    expect(axiosInstance.put).toHaveBeenCalledWith('/tenant/config', mockData);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { slaApi } from '../slaApi';
import axiosInstance from '../axiosInstance';
import type { CreateSlaConfigRequest, UpdateSlaConfigRequest } from '../../types/sla';

vi.mock('../axiosInstance');

describe('slaApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches sla configs', async () => {
    const mockData = [{ id: '1', priority: 1 }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });
    const result = await slaApi.getSlaConfigs('type-1');
    expect(result).toEqual(mockData);
    expect(axiosInstance.get).toHaveBeenCalledWith('/ticket-types/type-1/sla-configs');
  });

  it('creates sla config', async () => {
    const mockData = { priority: 2 };
    const mockRes = { id: '2', priority: 2 };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockRes });
    const result = await slaApi.createSlaConfig('type-1', mockData as unknown as CreateSlaConfigRequest);
    expect(result).toEqual(mockRes);
    expect(axiosInstance.post).toHaveBeenCalledWith('/ticket-types/type-1/sla-configs', mockData);
  });

  it('updates sla config', async () => {
    const mockData = { priority: 3 };
    const mockRes = { id: '3', priority: 3 };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: mockRes });
    const result = await slaApi.updateSlaConfig('3', mockData as unknown as UpdateSlaConfigRequest);
    expect(result).toEqual(mockRes);
    expect(axiosInstance.put).toHaveBeenCalledWith('/sla-configs/3', mockData);
  });

  it('deletes sla config', async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({});
    await slaApi.deleteSlaConfig('4');
    expect(axiosInstance.delete).toHaveBeenCalledWith('/sla-configs/4');
  });
});

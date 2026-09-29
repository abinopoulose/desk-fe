import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSla } from '../useSla';
import { slaApi } from '../../api/slaApi';
import type { SlaConfigDTO } from '../../types/sla';

vi.mock('../../api/slaApi', () => ({
  slaApi: {
    getSlaConfigs: vi.fn(),
    createSlaConfig: vi.fn(),
    updateSlaConfig: vi.fn(),
    deleteSlaConfig: vi.fn(),
  },
}));

describe('useSla hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches SLA configs successfully', async () => {
    const mockConfigs: SlaConfigDTO[] = [
      {
        id: 'sla1',
        ticketTypeId: 't1',
        priority: 1,
        resolutionMinutes: 240,
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        escalationHooks: null,
        createdAt: '2026-09-29T00:00:00Z',
        updatedAt: '2026-09-29T00:00:00Z',
      },
    ];
    vi.mocked(slaApi.getSlaConfigs).mockResolvedValueOnce(mockConfigs);

    const { result } = renderHook(() => useSla());

    await act(async () => {
      const res = await result.current.fetchSlaConfigs('t1');
      expect(res).toEqual(mockConfigs);
    });

    expect(result.current.data).toEqual(mockConfigs);
    expect(result.current.loading).toBe(false);
  });

  it('handles create, update, and delete SLA config', async () => {
    const mockConfig: SlaConfigDTO = {
      id: 'sla1',
      ticketTypeId: 't1',
      priority: 1,
      resolutionMinutes: 240,
      workingDays: [1, 2, 3, 4, 5],
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      escalationHooks: null,
      createdAt: '2026-09-29T00:00:00Z',
      updatedAt: '2026-09-29T00:00:00Z',
    };
    vi.mocked(slaApi.createSlaConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(slaApi.updateSlaConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(slaApi.deleteSlaConfig).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useSla());

    await act(async () => {
      const created = await result.current.createSlaConfig('t1', {
        priority: 1,
        resolutionMinutes: 240,
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        escalationHooks: null,
      });
      expect(created).toEqual(mockConfig);

      const updated = await result.current.updateSlaConfig('sla1', {
        priority: 1,
        resolutionMinutes: 120,
        workingDays: [1, 2, 3, 4, 5],
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        escalationHooks: null,
      });
      expect(updated).toEqual(mockConfig);

      await result.current.deleteSlaConfig('sla1');
    });

    expect(slaApi.deleteSlaConfig).toHaveBeenCalledWith('sla1');
  });

  it('handles errors', async () => {
    vi.mocked(slaApi.getSlaConfigs).mockRejectedValueOnce(new Error('SLA error'));

    const { result } = renderHook(() => useSla());

    await act(async () => {
      try {
        await result.current.fetchSlaConfigs('t1');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('SLA error');
  });
});

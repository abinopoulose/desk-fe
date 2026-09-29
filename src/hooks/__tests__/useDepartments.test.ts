import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDepartments } from '../useDepartments';
import { departmentApi } from '../../api/departmentApi';

vi.mock('../../api/departmentApi', () => ({
  departmentApi: {
    getAllDepartments: vi.fn(),
    getDepartmentById: vi.fn(),
    createDepartment: vi.fn(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
  },
}));

describe('useDepartments hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches departments successfully', async () => {
    const mockDepts = [{ id: 'd1', name: 'IT', createdAt: '', updatedAt: '' }];
    vi.mocked(departmentApi.getAllDepartments).mockResolvedValueOnce(mockDepts);

    const { result } = renderHook(() => useDepartments());

    await act(async () => {
      const res = await result.current.fetchDepartments();
      expect(res).toEqual(mockDepts);
    });

    expect(result.current.data).toEqual(mockDepts);
    expect(result.current.loading).toBe(false);
  });

  it('handles get, create, update, and delete department', async () => {
    const mockDept = { id: 'd1', name: 'IT', description: 'Tech', createdAt: '', updatedAt: '' };
    vi.mocked(departmentApi.getDepartmentById).mockResolvedValueOnce(mockDept);
    vi.mocked(departmentApi.createDepartment).mockResolvedValueOnce(mockDept);
    vi.mocked(departmentApi.updateDepartment).mockResolvedValueOnce(mockDept);
    vi.mocked(departmentApi.deleteDepartment).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDepartments());

    await act(async () => {
      const dept = await result.current.getDepartment('d1');
      expect(dept).toEqual(mockDept);

      const created = await result.current.createDepartment({ name: 'IT', description: 'Tech' });
      expect(created).toEqual(mockDept);

      const updated = await result.current.updateDepartment('d1', { name: 'IT Ops' });
      expect(updated).toEqual(mockDept);

      await result.current.deleteDepartment('d1');
    });

    expect(departmentApi.deleteDepartment).toHaveBeenCalledWith('d1');
  });

  it('handles errors', async () => {
    vi.mocked(departmentApi.getAllDepartments).mockRejectedValueOnce(new Error('Depts error'));

    const { result } = renderHook(() => useDepartments());

    await act(async () => {
      try {
        await result.current.fetchDepartments();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Depts error');
  });
});

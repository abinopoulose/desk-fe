import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDepartments } from '../useDepartments';
import { departmentApi } from '../../api/departmentApi';
import { DEFAULT_DEPARTMENT_FORM_VALUES } from '../../constants/departmentConstants';

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

  it('fetches departments on mount', async () => {
    const mockDepts = [{ id: 'd1', name: 'IT', createdAt: '', updatedAt: '' }];
    vi.mocked(departmentApi.getAllDepartments).mockResolvedValueOnce(mockDepts);

    const { result } = renderHook(() => useDepartments());

    // Wait for the initial effect to complete
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.departments).toEqual(mockDepts);
    expect(result.current.error).toBeNull();
  });

  it('handles form state and edit mode', () => {
    const { result } = renderHook(() => useDepartments());

    act(() => {
      result.current.setFormField('name', 'HR');
    });

    expect(result.current.formState.name).toBe('HR');
    expect(result.current.isEditing).toBe(false);

    const mockDept = { id: 'd1', name: 'Finance', description: 'Money stuff', createdAt: '', updatedAt: '' };
    
    act(() => {
      result.current.startEdit(mockDept);
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.formState.name).toBe('Finance');
    expect(result.current.formState.description).toBe('Money stuff');

    act(() => {
      result.current.cancelEdit();
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.formState).toEqual(DEFAULT_DEPARTMENT_FORM_VALUES);
  });

  it('handles create and update operations', async () => {
    vi.mocked(departmentApi.getAllDepartments).mockResolvedValue([]);
    const { result } = renderHook(() => useDepartments());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Create
    act(() => {
      result.current.startEdit();
      result.current.setFormField('name', 'IT');
      result.current.setFormField('description', 'Tech');
    });

    vi.mocked(departmentApi.createDepartment).mockResolvedValueOnce({ id: 'new', name: 'IT', createdAt: '', updatedAt: '' });
    
    await act(async () => {
      await result.current.save();
    });

    expect(departmentApi.createDepartment).toHaveBeenCalledWith({ name: 'IT', description: 'Tech' });
    expect(result.current.isEditing).toBe(false);

    // Update
    act(() => {
      result.current.startEdit({ id: 'd1', name: 'HR', description: '', createdAt: '', updatedAt: '' });
      result.current.setFormField('name', 'HR updated');
    });

    vi.mocked(departmentApi.updateDepartment).mockResolvedValueOnce({ id: 'd1', name: 'HR updated', createdAt: '', updatedAt: '' });
    
    await act(async () => {
      await result.current.save();
    });

    expect(departmentApi.updateDepartment).toHaveBeenCalledWith('d1', { name: 'HR updated', description: '' });
  });

  it('handles delete operation', async () => {
    vi.mocked(departmentApi.getAllDepartments).mockResolvedValue([]);
    const { result } = renderHook(() => useDepartments());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(departmentApi.deleteDepartment).mockResolvedValueOnce(undefined);
    
    await act(async () => {
      await result.current.remove('d1');
    });

    expect(departmentApi.deleteDepartment).toHaveBeenCalledWith('d1');
  });
});

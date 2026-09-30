import { useState, useCallback, useEffect } from 'react';
import { departmentApi } from '../api/departmentApi';
import type { DepartmentDTO, CreateDepartmentRequest, UpdateDepartmentRequest } from '../types/department';
import { DEFAULT_DEPARTMENT_FORM_VALUES } from '../constants/departmentConstants';
import type { ApiError } from '../utils/apiErrorHandler';

export function useDepartments() {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState(DEFAULT_DEPARTMENT_FORM_VALUES);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await departmentApi.getAllDepartments();
      setDepartments(data);
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to load departments';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const setFormField = useCallback((field: keyof typeof DEFAULT_DEPARTMENT_FORM_VALUES, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const startEdit = useCallback((dept?: DepartmentDTO) => {
    if (dept) {
      setEditingId(dept.id);
      setFormState({
        name: dept.name,
        description: dept.description || '',
        managerId: '', 
      });
    } else {
      setEditingId(null);
      setFormState(DEFAULT_DEPARTMENT_FORM_VALUES);
    }
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setFormState(DEFAULT_DEPARTMENT_FORM_VALUES);
  }, []);

  const save = useCallback(async () => {
    if (editingId) {
      const updateData: UpdateDepartmentRequest = { 
        name: formState.name, 
        description: formState.description 
      };
      await departmentApi.updateDepartment(editingId, updateData);
    } else {
      const createData: CreateDepartmentRequest = { 
        name: formState.name, 
        description: formState.description 
      };
      await departmentApi.createDepartment(createData);
    }
    cancelEdit();
    await refetch();
  }, [editingId, formState, refetch, cancelEdit]);

  const remove = useCallback(async (id: string) => {
    await departmentApi.deleteDepartment(id);
    await refetch();
  }, [refetch]);

  return {
    departments,
    loading,
    error,
    formState,
    setFormField,
    isEditing: !!editingId,
    startEdit,
    cancelEdit,
    save,
    remove,
    refetch,
  };
}

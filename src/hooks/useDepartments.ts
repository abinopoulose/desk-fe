import { useState, useCallback } from 'react';
import { departmentApi } from '../api/departmentApi';
import type {
  DepartmentDTO,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from '../types/department';

export function useDepartments() {
  const [data, setData] = useState<DepartmentDTO[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async (): Promise<DepartmentDTO[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await departmentApi.getAllDepartments();
      setData(response);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch departments';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDepartment = useCallback(async (id: string): Promise<DepartmentDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await departmentApi.getDepartmentById(id);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch department';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = useCallback(
    async (req: CreateDepartmentRequest): Promise<DepartmentDTO> => {
      setLoading(true);
      setError(null);
      try {
        const response = await departmentApi.createDepartment(req);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create department';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateDepartment = useCallback(
    async (id: string, req: UpdateDepartmentRequest): Promise<DepartmentDTO> => {
      setLoading(true);
      setError(null);
      try {
        const response = await departmentApi.updateDepartment(id, req);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update department';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteDepartment = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await departmentApi.deleteDepartment(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete department';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}

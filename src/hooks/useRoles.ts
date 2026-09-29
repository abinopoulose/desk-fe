import { useState, useCallback } from 'react';
import { roleApi } from '../api/roleApi';
import type {
  RoleDTO,
  CreateRoleRequest,
  AssignRolesRequest,
  UserRolesResponse,
} from '../types/role';

export function useRoles() {
  const [data, setData] = useState<RoleDTO[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async (): Promise<RoleDTO[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await roleApi.getAllRoles();
      setData(response);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (req: CreateRoleRequest): Promise<RoleDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await roleApi.createRole(req);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create role';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignRoles = useCallback(
    async (userId: string, req: AssignRolesRequest): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await roleApi.assignRoles(userId, req);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to assign roles';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchUserRoles = useCallback(async (userId: string): Promise<UserRolesResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await roleApi.getUserRoles(userId);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user roles';
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
    fetchRoles,
    createRole,
    assignRoles,
    fetchUserRoles,
  };
}

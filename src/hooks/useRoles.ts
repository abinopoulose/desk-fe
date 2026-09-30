import { useState, useCallback, useEffect } from 'react';
import { roleApi } from '../api/roleApi';
import type {
  RoleDTO,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRolesRequest,
  UserRolesResponse,
} from '../types/role';
import { DEFAULT_ROLE_VALUES } from '../constants';

export interface RoleFormState {
  name: string;
  description: string;
  permissions: string[];
}

export interface UseRolesOptions {
  autoFetch?: boolean;
}

export interface UseRolesReturn {
  roles: RoleDTO[];
  data: RoleDTO[] | null;
  loading: boolean;
  error: string | null;
  formState: RoleFormState;
  setFormField: (field: keyof RoleFormState, value: unknown) => void;
  togglePermission: (permission: string) => void;
  isEditing: boolean;
  editingRole: RoleDTO | null;
  isModalOpen: boolean;
  startEdit: (role?: RoleDTO | null) => void;
  openModal: (role?: RoleDTO | null) => void;
  cancelEdit: () => void;
  closeModal: () => void;
  save: (e?: React.FormEvent) => Promise<RoleDTO | null>;
  remove: (roleNameOrId: string, skipConfirm?: boolean) => Promise<void>;
  refetch: () => Promise<RoleDTO[]>;
  fetchRoles: () => Promise<RoleDTO[]>;
  createRole: (req: CreateRoleRequest) => Promise<RoleDTO>;
  updateRole: (roleName: string, req: UpdateRoleRequest) => Promise<RoleDTO>;
  deleteRole: (roleName: string) => Promise<void>;
  assignRoles: (userId: string, req: AssignRolesRequest) => Promise<void>;
  fetchUserRoles: (userId: string) => Promise<UserRolesResponse>;
}

export function useRoles(options?: UseRolesOptions): UseRolesReturn {
  const { autoFetch = false } = options || {};

  const [data, setData] = useState<RoleDTO[] | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  // Form & Editing state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<RoleDTO | null>(null);
  const [formState, setFormState] = useState<RoleFormState>({
    name: DEFAULT_ROLE_VALUES.name,
    description: DEFAULT_ROLE_VALUES.description,
    permissions: [...DEFAULT_ROLE_VALUES.permissions],
  });

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

  const refetch = useCallback(async (): Promise<RoleDTO[]> => {
    return fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (autoFetch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchRoles().catch(() => {});
    }
  }, [autoFetch, fetchRoles]);

  const setFormField = useCallback((field: keyof RoleFormState, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const togglePermission = useCallback((permission: string) => {
    setFormState((prev) => {
      const exists = prev.permissions.includes(permission);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permission)
          : [...prev.permissions, permission],
      };
    });
  }, []);

  const startEdit = useCallback((role?: RoleDTO | null) => {
    if (role) {
      setEditingRole(role);
      setIsEditing(true);
      setFormState({
        name: role.roleName,
        description: role.description || '',
        permissions: [...(role.privileges || [])],
      });
    } else {
      setEditingRole(null);
      setIsEditing(false);
      setFormState({
        name: DEFAULT_ROLE_VALUES.name,
        description: DEFAULT_ROLE_VALUES.description,
        permissions: [...DEFAULT_ROLE_VALUES.permissions],
      });
    }
    setIsModalOpen(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingRole(null);
    setIsEditing(false);
    setFormState({
      name: DEFAULT_ROLE_VALUES.name,
      description: DEFAULT_ROLE_VALUES.description,
      permissions: [...DEFAULT_ROLE_VALUES.permissions],
    });
    setIsModalOpen(false);
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

  const updateRole = useCallback(async (roleName: string, req: UpdateRoleRequest): Promise<RoleDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await roleApi.updateRole(roleName, req);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRole = useCallback(async (roleName: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await roleApi.deleteRole(roleName);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete role';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(
    async (e?: React.FormEvent): Promise<RoleDTO | null> => {
      e?.preventDefault();
      setLoading(true);
      setError(null);
      try {
        const payload: CreateRoleRequest = {
          roleName: formState.name,
          description: formState.description,
          privileges: formState.permissions,
        };
        let result: RoleDTO;
        if (isEditing && editingRole) {
          result = await roleApi.updateRole(editingRole.roleName, payload);
        } else {
          result = await roleApi.createRole(payload);
        }
        cancelEdit();
        await fetchRoles();
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to save role';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [formState, isEditing, editingRole, cancelEdit, fetchRoles]
  );

  const remove = useCallback(
    async (roleNameOrId: string, skipConfirm = false): Promise<void> => {
      if (!skipConfirm && typeof window !== 'undefined' && window.confirm) {
        if (!window.confirm(`Are you sure you want to delete role "${roleNameOrId}"?`)) {
          return;
        }
      }
      setLoading(true);
      setError(null);
      try {
        await roleApi.deleteRole(roleNameOrId);
        await fetchRoles();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete role';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [fetchRoles]
  );

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
    roles: data || [],
    data,
    loading,
    error,
    formState,
    setFormField,
    togglePermission,
    isEditing,
    editingRole,
    isModalOpen,
    startEdit,
    openModal: startEdit,
    cancelEdit,
    closeModal: cancelEdit,
    save,
    remove,
    refetch,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    assignRoles,
    fetchUserRoles,
  };
}

import { useCallback } from 'react';
import { roleApi } from '../api/roleApi';
import type { RoleDTO, CreateRoleRequest, UpdateRoleRequest, AssignRolesRequest, UserRolesResponse } from '../types/role';
import { DEFAULT_ROLE_VALUES } from '../constants/roleConstants';
import { useCrud } from './useCrud';
import type { ApiError } from '../utils/apiErrorHandler';

export interface UseRolesOptions {
  autoFetch?: boolean;
}

export interface RoleFormState {
  name: string;
  description: string;
  permissions: string[];
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
  const crud = useCrud<RoleDTO, RoleFormState>({
    autoFetch: options?.autoFetch ?? false,
    fetchAll: roleApi.getAllRoles,
    create: (data: CreateRoleRequest) => roleApi.createRole(data),
    update: (id: string, data: UpdateRoleRequest) => roleApi.updateRole(id, data),
    remove: roleApi.deleteRole,
    defaultFormState: {
      name: DEFAULT_ROLE_VALUES.name,
      description: DEFAULT_ROLE_VALUES.description,
      permissions: [...DEFAULT_ROLE_VALUES.permissions],
    },
    mapEntityToFormState: (role) => ({
      name: role.roleName,
      description: role.description || '',
      permissions: [...(role.privileges || [])],
    }),
    mapFormStateToPayload: (formState) => ({
      roleName: formState.name,
      description: formState.description,
      privileges: formState.permissions,
    }),
    getId: (role) => role.roleName,
  });

  const togglePermission = useCallback((permission: string) => {
    crud.setFormState((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission]
    }));
  }, [crud.setFormState]);

  const assignRoles = useCallback(
    async (userId: string, req: AssignRolesRequest): Promise<void> => {
      crud.setLoading(true);
      crud.setError(null);
      try {
        await roleApi.assignRoles(userId, req);
      } catch (err: unknown) {
        const message = (err as ApiError)?.message || 'Failed to assign roles';
        crud.setError(message);
        throw err;
      } finally {
        crud.setLoading(false);
      }
    },
    [crud]
  );

  const fetchUserRoles = useCallback(async (userId: string): Promise<UserRolesResponse> => {
    crud.setLoading(true);
    crud.setError(null);
    try {
      const response = await roleApi.getUserRoles(userId);
      return response;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to fetch user roles';
      crud.setError(message);
      throw err;
    } finally {
      crud.setLoading(false);
    }
  }, [crud]);

  return {
    roles: crud.items,
    data: crud.items.length > 0 ? crud.items : null,
    loading: crud.loading,
    error: crud.error,
    formState: crud.formState,
    setFormField: crud.setFormField,
    togglePermission,
    isEditing: crud.isEditing,
    editingRole: crud.editingItem,
    isModalOpen: crud.isModalOpen,
    startEdit: crud.startEdit,
    openModal: crud.startEdit,
    cancelEdit: crud.cancelEdit,
    closeModal: crud.cancelEdit,
    save: crud.save as any,
    remove: async (roleNameOrId: string, /* skipConfirm = false */) => {
      await crud.remove(roleNameOrId);
    },
    refetch: crud.refetch as any,
    fetchRoles: crud.refetch as any,
    createRole: roleApi.createRole,
    updateRole: roleApi.updateRole,
    deleteRole: roleApi.deleteRole,
    assignRoles,
    fetchUserRoles,
  };
}

import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { RoleDTO, CreateRoleRequest, AssignRolesRequest, UserRolesResponse } from '../types/role';

export const roleApi = {
  getAllRoles: async (): Promise<RoleDTO[]> => {
    const response = await axiosInstance.get(API_PATHS.ROLES.BASE);
    return response.data;
  },

  createRole: async (data: CreateRoleRequest): Promise<RoleDTO> => {
    const response = await axiosInstance.post(API_PATHS.ROLES.BASE, data);
    return response.data;
  },

  updateRole: async (roleName: string, data: CreateRoleRequest): Promise<RoleDTO> => {
    const response = await axiosInstance.put(`${API_PATHS.ROLES.BASE}/${roleName}`, data);
    return response.data;
  },

  deleteRole: async (roleName: string): Promise<void> => {
    await axiosInstance.delete(`${API_PATHS.ROLES.BASE}/${roleName}`);
  },

  assignRoles: async (userId: string, data: AssignRolesRequest): Promise<void> => {
    await axiosInstance.put(`/users/${userId}/roles`, data);
  },

  getUserRoles: async (userId: string): Promise<UserRolesResponse> => {
    const response = await axiosInstance.get(`/users/${userId}/roles`);
    return response.data;
  },
};

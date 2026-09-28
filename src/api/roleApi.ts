import axiosInstance from './axiosInstance';
import type { RoleDTO, CreateRoleRequest, AssignRolesRequest, UserRolesResponse } from '../types/role';

export const getAllRoles = async (): Promise<RoleDTO[]> => {
  const response = await axiosInstance.get('/api/v1/roles');
  return response.data;
};

export const createRole = async (data: CreateRoleRequest): Promise<RoleDTO> => {
  const response = await axiosInstance.post('/api/v1/roles', data);
  return response.data;
};

export const assignRoles = async (userId: string, roles: string[]): Promise<void> => {
  const data: AssignRolesRequest = { roles };
  await axiosInstance.put(`/api/v1/users/${userId}/roles`, data);
};

export const getUserRoles = async (userId: string): Promise<string[]> => {
  const response = await axiosInstance.get<UserRolesResponse>(`/api/v1/users/${userId}/roles`);
  return response.data.roles;
};

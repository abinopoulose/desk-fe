import axiosInstance from './axiosInstance';
import type { UserProfileResponse, OrgNode, UserListResponse } from '../types/user';

export const getUserProfile = async (userId: string): Promise<UserProfileResponse> => {
  const response = await axiosInstance.get(`/api/v1/users/${userId}/profile`);
  return response.data;
};

export const getOrgHierarchy = async (rootUserId?: string): Promise<OrgNode[]> => {
  const params = rootUserId ? { rootUserId } : {};
  const response = await axiosInstance.get('/api/v1/users/hierarchy', { params });
  return response.data;
};

export const getAllUsers = async (search?: string, page: number = 0, size: number = 20): Promise<UserListResponse> => {
  const params = { ...(search ? { search } : {}), page, size };
  const response = await axiosInstance.get('/api/v1/users', { params });
  return response.data;
};

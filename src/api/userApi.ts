import axiosInstance from './axiosInstance';
import type { UserProfileResponse, OrgNode } from '../types/user';

export const getUserProfile = async (userId: string): Promise<UserProfileResponse> => {
  const response = await axiosInstance.get(`/users/${userId}/profile`);
  return response.data;
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfileResponse>): Promise<UserProfileResponse> => {
  const response = await axiosInstance.put(`/users/${userId}/profile`, data);
  return response.data;
};

export const getOrgHierarchy = async (rootUserId?: string): Promise<OrgNode[]> => {
  const params = rootUserId ? { rootUserId } : {};
  const response = await axiosInstance.get('/users/hierarchy', { params });
  return response.data;
};

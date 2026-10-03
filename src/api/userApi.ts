import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { UserProfileResponse, OrgNode } from '../types/user';

export const getUserProfile = async (userId: string): Promise<UserProfileResponse> => {
  const response = await axiosInstance.get(API_PATHS.USERS.PROFILE(userId));
  return response.data;
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfileResponse>): Promise<UserProfileResponse> => {
  const response = await axiosInstance.put(API_PATHS.USERS.PROFILE(userId), data);
  return response.data;
};

export const getOrgHierarchy = async (rootUserId?: string): Promise<OrgNode[]> => {
  const params = rootUserId ? { rootUserId } : {};
  const response = await axiosInstance.get(API_PATHS.USERS.HIERARCHY, { params });
  return response.data;
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<UserProfileResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axiosInstance.post(`/users/${userId}/profile-picture`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { InviteEmployeeRequest, User } from '../types/user';

export const inviteEmployee = async (data: InviteEmployeeRequest) => {
  const response = await axiosInstance.post(API_PATHS.USERS.INVITE, data);
  return response.data;
};

export const getOrgUsers = async (search?: string): Promise<User[]> => {
  const response = await axiosInstance.get(API_PATHS.USERS.BASE, {
    params: search ? { search } : undefined,
  });
  const data = response.data;
  const userList = Array.isArray(data) ? data : (data?.users || []);
  return userList.map((u: any) => ({
    id: u.id,
    displayId: u.displayId,
    email: u.email,
    fullName: u.fullName,
    title: u.title,
    profilePictureUrl: u.profilePictureUrl,
    roles: u.roles || [],
    status: u.status || u.activationStatus || 'ACTIVE'
  }));
};

export const resendInvitation = async (userId: string) => {
  const response = await axiosInstance.post(API_PATHS.USERS.RESEND_INVITE(userId));
  return response.data;
};

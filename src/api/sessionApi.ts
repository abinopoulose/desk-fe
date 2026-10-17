import axiosInstance from './axiosInstance';
import type { UserSession, ChangePasswordPayload, ResetTokenInfo } from '../types/session';

export const getActiveSessions = async (): Promise<UserSession[]> => {
  const response = await axiosInstance.get<UserSession[]>('/api/v1/users/me/sessions');
  return response.data;
};

export const getLoginHistory = async (): Promise<UserSession[]> => {
  const response = await axiosInstance.get<UserSession[]>('/api/v1/users/me/sessions/history');
  return response.data;
};

export const terminateSession = async (sessionId: string): Promise<void> => {
  await axiosInstance.post(`/api/v1/users/me/sessions/${sessionId}/terminate`);
};

export const terminateOtherSessions = async (): Promise<{ message: string; count: number }> => {
  const response = await axiosInstance.post<{ message: string; count: number }>('/api/v1/users/me/sessions/terminate-others');
  return response.data;
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>('/api/v1/users/me/change-password', payload);
  return response.data;
};

export const requestForgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>('/api/v1/auth/forgot-password', { email });
  return response.data;
};

export const getResetTokenInfo = async (token: string): Promise<ResetTokenInfo> => {
  const response = await axiosInstance.get<ResetTokenInfo>('/api/v1/auth/reset-token-info', {
    params: { token },
  });
  return response.data;
};

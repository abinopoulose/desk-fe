import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { LoginRequest, AuthResponse, SetPasswordRequest } from '../types/auth';

export const login = async (request: LoginRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>(API_PATHS.AUTH.LOGIN, request);
  return response.data;
};

export const setPassword = async (request: SetPasswordRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>(API_PATHS.AUTH.SET_PASSWORD, request);
  return response.data;
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  const response = await axiosInstance.get<AuthResponse>(API_PATHS.AUTH.ME);
  return response.data;
};


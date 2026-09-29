import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export const login = async (request: LoginRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>(API_PATHS.AUTH.LOGIN, request);
  return response.data;
};

export const register = async (request: RegisterRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>(API_PATHS.AUTH.REGISTER, request);
  return response.data;
};

import axiosInstance from './axiosInstance';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export const login = async (request: LoginRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/login', request);
  return response.data;
};

export const register = async (request: RegisterRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/register', request);
  return response.data;
};

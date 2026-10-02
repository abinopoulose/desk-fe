import axiosInstance from './axiosInstance';
import type { CreateOrgRequest, AuthResponse } from '../types/auth';
import { API_PATHS } from '../constants';

export const registerOrganization = (data: CreateOrgRequest) =>
    axiosInstance.post<AuthResponse>(API_PATHS.ORGANIZATIONS.REGISTER, data);

import axiosInstance from './axiosInstance';
import type { CreateOrgRequest, AuthResponse } from '../types/auth';
import { API_PATHS } from '../constants';

export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  domain: string;
  isActive?: boolean;
}

export const registerOrganization = (data: CreateOrgRequest) =>
    axiosInstance.post<AuthResponse>(API_PATHS.ORGANIZATIONS.REGISTER, data);

export const resolveOrganization = (subdomain: string) =>
    axiosInstance.get<OrganizationDTO>(API_PATHS.ORGANIZATIONS.RESOLVE(subdomain));

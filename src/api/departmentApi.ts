import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type {
  DepartmentDTO,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  MyDepartmentDTO,
  DepartmentMemberDTO,
  AddDepartmentMemberRequest,
  UpdateDepartmentMemberRequest,
  DepartmentMetricsDTO,
} from '../types/department';

const BASE_URL = API_PATHS.DEPARTMENTS.BASE;

export const departmentApi = {
  getAllDepartments: async (): Promise<DepartmentDTO[]> => {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  },

  getDepartmentById: async (id: string): Promise<DepartmentDTO> => {
    const response = await axiosInstance.get(API_PATHS.DEPARTMENTS.BY_ID(id));
    return response.data;
  },

  getMyDepartments: async (): Promise<MyDepartmentDTO[]> => {
    const response = await axiosInstance.get(API_PATHS.DEPARTMENTS.MY);
    return response.data;
  },

  getDepartmentMembers: async (id: string, search?: string): Promise<DepartmentMemberDTO[]> => {
    const response = await axiosInstance.get(API_PATHS.DEPARTMENTS.MEMBERS(id), {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  addDepartmentMember: async (id: string, data: AddDepartmentMemberRequest): Promise<DepartmentMemberDTO> => {
    const response = await axiosInstance.post(API_PATHS.DEPARTMENTS.MEMBERS(id), data);
    return response.data;
  },

  updateDepartmentMemberRole: async (
    id: string,
    memberUserId: string,
    data: UpdateDepartmentMemberRequest
  ): Promise<DepartmentMemberDTO> => {
    const response = await axiosInstance.put(API_PATHS.DEPARTMENTS.MEMBER_ROLE(id, memberUserId), data);
    return response.data;
  },

  removeDepartmentMember: async (id: string, memberUserId: string): Promise<void> => {
    await axiosInstance.delete(API_PATHS.DEPARTMENTS.MEMBER_ROLE(id, memberUserId));
  },

  getDepartmentMetrics: async (id: string): Promise<DepartmentMetricsDTO> => {
    const response = await axiosInstance.get(API_PATHS.DEPARTMENTS.METRICS(id));
    return response.data;
  },

  createDepartment: async (data: CreateDepartmentRequest): Promise<DepartmentDTO> => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data;
  },

  updateDepartment: async (id: string, data: UpdateDepartmentRequest): Promise<DepartmentDTO> => {
    const response = await axiosInstance.put(API_PATHS.DEPARTMENTS.BY_ID(id), data);
    return response.data;
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await axiosInstance.delete(API_PATHS.DEPARTMENTS.BY_ID(id));
  }
};

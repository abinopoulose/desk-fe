import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { DepartmentDTO, CreateDepartmentRequest, UpdateDepartmentRequest } from '../types/department';

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

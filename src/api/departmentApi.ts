import axiosInstance from './axiosInstance';
import { DepartmentDTO, CreateDepartmentRequest, UpdateDepartmentRequest } from '../types/department';

const BASE_URL = '/api/v1/departments';

export const departmentApi = {
  getAllDepartments: async (): Promise<DepartmentDTO[]> => {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  },

  getDepartmentById: async (id: string): Promise<DepartmentDTO> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createDepartment: async (data: CreateDepartmentRequest): Promise<DepartmentDTO> => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data;
  },

  updateDepartment: async (id: string, data: UpdateDepartmentRequest): Promise<DepartmentDTO> => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  }
};

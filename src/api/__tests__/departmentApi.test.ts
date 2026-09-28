import { describe, it, expect, vi, beforeEach } from 'vitest';
import { departmentApi } from '../departmentApi';
import axiosInstance from '../axiosInstance';

vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('departmentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all departments', async () => {
    const mockData = [{ id: '1', name: 'IT', createdAt: '2023', updatedAt: '2023' }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });

    const result = await departmentApi.getAllDepartments();
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/departments');
    expect(result).toEqual(mockData);
  });

  it('should fetch department by id', async () => {
    const mockData = { id: '1', name: 'IT', createdAt: '2023', updatedAt: '2023' };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });

    const result = await departmentApi.getDepartmentById('1');
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/departments/1');
    expect(result).toEqual(mockData);
  });

  it('should create department', async () => {
    const mockData = { id: '1', name: 'IT', createdAt: '2023', updatedAt: '2023' };
    const request = { name: 'IT' };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockData });

    const result = await departmentApi.createDepartment(request);
    expect(axiosInstance.post).toHaveBeenCalledWith('/api/v1/departments', request);
    expect(result).toEqual(mockData);
  });

  it('should update department', async () => {
    const mockData = { id: '1', name: 'IT Updated', createdAt: '2023', updatedAt: '2023' };
    const request = { name: 'IT Updated' };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: mockData });

    const result = await departmentApi.updateDepartment('1', request);
    expect(axiosInstance.put).toHaveBeenCalledWith('/api/v1/departments/1', request);
    expect(result).toEqual(mockData);
  });

  it('should delete department', async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({});

    await departmentApi.deleteDepartment('1');
    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/v1/departments/1');
  });
});

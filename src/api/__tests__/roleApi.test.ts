import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllRoles, createRole, assignRoles, getUserRoles } from '../roleApi';
import axiosInstance from '../axiosInstance';

vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('roleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all roles', async () => {
    const mockData = [{ roleName: 'ADMIN', privileges: ['USER_READ'] }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });

    const result = await getAllRoles();
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/roles');
    expect(result).toEqual(mockData);
  });

  it('should create role', async () => {
    const mockData = { roleName: 'CUSTOM', privileges: ['USER_READ'] };
    const request = { roleName: 'CUSTOM', privileges: ['USER_READ'] };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockData });

    const result = await createRole(request);
    expect(axiosInstance.post).toHaveBeenCalledWith('/api/v1/roles', request);
    expect(result).toEqual(mockData);
  });

  it('should assign roles', async () => {
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({});

    await assignRoles('user1', ['ADMIN']);
    expect(axiosInstance.put).toHaveBeenCalledWith('/api/v1/users/user1/roles', { roles: ['ADMIN'] });
  });

  it('should get user roles', async () => {
    const mockData = { userId: 'user1', roles: ['ADMIN'] };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });

    const result = await getUserRoles('user1');
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/users/user1/roles');
    expect(result).toEqual(['ADMIN']);
  });
});

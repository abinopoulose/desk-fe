import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { getUserProfile, getOrgHierarchy } from '../api/userApi';
import axiosInstance from '../api/axiosInstance';

vi.mock('../api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('userApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should fetch user profile', async () => {
      const mockData = { id: '1', fullName: 'Test User' };
      (axiosInstance.get as Mock).mockResolvedValueOnce({ data: mockData });

      const result = await getUserProfile('1');
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/users/1/profile');
      expect(result).toEqual(mockData);
    });
  });

  describe('getOrgHierarchy', () => {
    it('should fetch org hierarchy without rootUserId', async () => {
      const mockData = [{ user: { id: '1', fullName: 'Root' }, children: [] }];
      (axiosInstance.get as Mock).mockResolvedValueOnce({ data: mockData });

      const result = await getOrgHierarchy();
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/users/hierarchy', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('should fetch org hierarchy with rootUserId', async () => {
      const mockData = [{ user: { id: '1', fullName: 'Root' }, children: [] }];
      (axiosInstance.get as Mock).mockResolvedValueOnce({ data: mockData });

      const result = await getOrgHierarchy('123');
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/users/hierarchy', { params: { rootUserId: '123' } });
      expect(result).toEqual(mockData);
    });
  });
});

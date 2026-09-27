import { describe, it, expect, vi } from 'vitest';
import { folderApi } from './folderApi';
import axiosInstance from './axiosInstance';

vi.mock('./axiosInstance', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('folderApi', () => {
  it('getFolderTree calls correct endpoint and returns data', async () => {
    const mockData = [{ id: '1', name: 'Root', children: [] }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });

    const result = await folderApi.getFolderTree();

    expect(axiosInstance.get).toHaveBeenCalledWith('/folders/tree');
    expect(result).toEqual(mockData);
  });

  it('getFolderContents calls correct endpoint and returns data', async () => {
    const mockData = { folderId: '1', folderName: 'Root', subfolders: [], ticketTypes: [] };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockData });

    const result = await folderApi.getFolderContents('1');

    expect(axiosInstance.get).toHaveBeenCalledWith('/folders/1/contents');
    expect(result).toEqual(mockData);
  });
});

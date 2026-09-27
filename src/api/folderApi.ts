import axiosInstance from './axiosInstance';
import type { FolderNodeDTO, FolderContentsDTO } from '../types/folder';

export const folderApi = {
  getFolderTree: async (): Promise<FolderNodeDTO[]> => {
    const response = await axiosInstance.get('/folders/tree');
    return response.data;
  },

  getFolderContents: async (folderId: string): Promise<FolderContentsDTO> => {
    const response = await axiosInstance.get(`/folders/${folderId}/contents`);
    return response.data;
  },
};

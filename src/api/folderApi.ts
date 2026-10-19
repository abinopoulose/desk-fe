import { API_PATHS } from '../constants';
import axiosInstance from './axiosInstance';
import type { FolderNodeDTO, FolderContentsDTO } from '../types/folder';

export const folderApi = {
  getFolderTree: async (): Promise<FolderNodeDTO[]> => {
    const response = await axiosInstance.get(API_PATHS.FOLDERS.TREE);
    return response.data;
  },

  getFolderContents: async (folderId: string): Promise<FolderContentsDTO> => {
    const response = await axiosInstance.get(API_PATHS.FOLDERS.CONTENTS(folderId));
    return response.data;
  },

  createFolder: async (data: { name: string; parentId?: string }): Promise<any> => {
    const response = await axiosInstance.post(API_PATHS.FOLDERS.BASE, data);
    return response.data;
  },

  updateFolder: async (id: string, data: { name: string; parentId?: string | null; moveToRoot?: boolean }): Promise<any> => {
    const response = await axiosInstance.put(`${API_PATHS.FOLDERS.BASE}/${id}`, data);
    return response.data;
  },

  deleteFolder: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${API_PATHS.FOLDERS.BASE}/${id}`);
  },
};

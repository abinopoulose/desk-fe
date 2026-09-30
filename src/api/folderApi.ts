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
};

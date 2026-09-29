import { useState, useCallback } from 'react';
import { folderApi } from '../api/folderApi';
import type { FolderNodeDTO, FolderContentsDTO } from '../types/folder';

export interface FolderData {
  tree: FolderNodeDTO[] | null;
  contents: FolderContentsDTO | null;
}

export function useFolders() {
  const [data, setData] = useState<FolderData>({
    tree: null,
    contents: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolderTree = useCallback(async (): Promise<FolderNodeDTO[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await folderApi.getFolderTree();
      setData((prev) => ({ ...prev, tree: response }));
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch folder tree';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFolderContents = useCallback(async (folderId: string): Promise<FolderContentsDTO> => {
    setLoading(true);
    setError(null);
    try {
      const response = await folderApi.getFolderContents(folderId);
      setData((prev) => ({ ...prev, contents: response }));
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch folder contents';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchFolderTree,
    fetchFolderContents,
  };
}

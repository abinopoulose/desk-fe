import { useState, useCallback, useEffect } from 'react';
import { folderApi } from '../api/folderApi';
import type { FolderContentsDTO } from '../types/folder';

export const useFolderContents = (folderId: string | null) => {
  const [contents, setContents] = useState<FolderContentsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContents = useCallback(async () => {
    if (!folderId) {
      setContents(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await folderApi.getFolderContents(folderId);
      setContents(data);
      setError(null);
    } catch {
      setError('Failed to load folder contents');
    } finally {
      setIsLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchContents();
  }, [fetchContents]);

  return { contents, isLoading, error, refetch: fetchContents };
};

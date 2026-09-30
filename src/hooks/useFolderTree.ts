import { useState, useCallback, useEffect } from 'react';
import { folderApi } from '../api/folderApi';
import type { FolderNodeDTO } from '../types/folder';

export const useFolderTree = () => {
  const [treeData, setTreeData] = useState<FolderNodeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const fetchTree = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await folderApi.getFolderTree();
      setTreeData(data);
      setError(null);
    } catch {
      setError('Failed to load folder tree');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTree();
  }, [fetchTree]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  return {
    treeData,
    isLoading,
    error,
    expandedNodes,
    toggleNode,
    refetch: fetchTree,
  };
};

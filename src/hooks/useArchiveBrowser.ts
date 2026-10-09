import { useState, useCallback, useEffect, useMemo } from 'react';
import { folderApi } from '../api/folderApi';
import { ticketTypeApi } from '../api/ticketTypeApi';
import type { FolderNodeDTO, FolderContentsDTO } from '../types/folder';
import type { TicketTypeSummaryDTO } from '../types/ticket';

interface BreadcrumbItem {
  id: string;
  name: string;
}

function buildBreadcrumbs(
  targetId: string,
  tree: FolderNodeDTO[],
  path: BreadcrumbItem[] = [],
): BreadcrumbItem[] | null {
  for (const node of tree) {
    const current = [...path, { id: node.id, name: node.name }];
    if (node.id === targetId) return current;
    if (node.children && node.children.length > 0) {
      const found = buildBreadcrumbs(targetId, node.children, current);
      if (found) return found;
    }
  }
  return null;
}

export function useArchiveBrowser() {
  const [treeData, setTreeData] = useState<FolderNodeDTO[]>([]);
  const [allTicketTypes, setAllTicketTypes] = useState<TicketTypeSummaryDTO[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [contents, setContents] = useState<FolderContentsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial data fetch: tree + all ticket types
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [tree, types] = await Promise.all([
          folderApi.getFolderTree(),
          ticketTypeApi.getTicketTypes(false),
        ]);
        setTreeData(tree);
        setAllTicketTypes(types);

        // Synthesize root contents from tree nodes
        setContents({
          folderId: 'root',
          folderName: '/',
          subfolders: tree.map((f) => ({
            id: f.id,
            name: f.name,
            parentId: f.parentId,
            createdAt: '',
            updatedAt: '',
          })),
          ticketTypes: [],
        });
      } catch (err) {
        console.error('Failed to load archive data', err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchInitialData();
  }, []);

  // Fetch folder contents when navigating into a folder
  const fetchFolderContents = useCallback(async (folderId: string | null) => {
    if (folderId === null) {
      // Synthesize root from tree
      setContents({
        folderId: 'root',
        folderName: '/',
        subfolders: treeData.map((f) => ({
          id: f.id,
          name: f.name,
          parentId: f.parentId,
          createdAt: '',
          updatedAt: '',
        })),
        ticketTypes: [],
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await folderApi.getFolderContents(folderId);
      setContents(data);
    } catch (err) {
      console.error('Failed to load folder contents', err);
    } finally {
      setIsLoading(false);
    }
  }, [treeData]);

  const navigateToFolder = useCallback(
    (folderId: string) => {
      setCurrentFolderId(folderId);
      const path = buildBreadcrumbs(folderId, treeData) || [];
      setBreadcrumbs(path);
      void fetchFolderContents(folderId);
    },
    [treeData, fetchFolderContents],
  );

  const navigateBack = useCallback(() => {
    if (breadcrumbs.length <= 1) {
      // Going back to root
      setCurrentFolderId(null);
      setBreadcrumbs([]);
      void fetchFolderContents(null);
    } else {
      const parentCrumbs = breadcrumbs.slice(0, -1);
      const parentId = parentCrumbs[parentCrumbs.length - 1].id;
      setCurrentFolderId(parentId);
      setBreadcrumbs(parentCrumbs);
      void fetchFolderContents(parentId);
    }
  }, [breadcrumbs, fetchFolderContents]);

  const navigateToRoot = useCallback(() => {
    setCurrentFolderId(null);
    setBreadcrumbs([]);
    void fetchFolderContents(null);
  }, [fetchFolderContents]);

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase().trim();
    return allTicketTypes.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.departmentName && t.departmentName.toLowerCase().includes(q)),
    );
  }, [searchQuery, allTicketTypes, isSearching]);

  return {
    currentFolderId,
    breadcrumbs,
    contents,
    isLoading,
    treeData,
    searchQuery,
    searchResults,
    isSearching,
    allTicketTypes,
    navigateToFolder,
    navigateBack,
    navigateToRoot,
    setSearchQuery,
  };
}

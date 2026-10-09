import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ArrowUp, 
  Search, 
  Check, 
  FolderTree, 
  HardDrive
} from 'lucide-react';
import type { FolderNodeDTO } from '../../types/folder';

export interface FolderExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string, folderName: string, fullPath: string) => void;
  currentFolderId?: string | null;
  treeData: FolderNodeDTO[];
  title?: string;
  description?: string;
  excludeId?: string; // Folder ID to exclude from selection/navigation (e.g. self)
  allowRoot?: boolean; // Whether root drive "/" can be selected as destination
}

interface CrumbItem {
  id: string;
  name: string;
}

/** Helper to find a node by ID in tree */
function findNode(nodes: FolderNodeDTO[], targetId: string): FolderNodeDTO | null {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.children?.length) {
      const found = findNode(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

/** Helper to build breadcrumb path from tree */
function getBreadcrumbs(nodes: FolderNodeDTO[], targetId: string, path: CrumbItem[] = []): CrumbItem[] | null {
  for (const node of nodes) {
    const currentPath = [...path, { id: node.id, name: node.name }];
    if (node.id === targetId) return currentPath;
    if (node.children?.length) {
      const found = getBreadcrumbs(node.children, targetId, currentPath);
      if (found) return found;
    }
  }
  return null;
}

/** Flatten all folders for fast search */
function flattenTree(nodes: FolderNodeDTO[], parentPath = ''): { id: string; name: string; fullPath: string; childrenCount: number }[] {
  const result: { id: string; name: string; fullPath: string; childrenCount: number }[] = [];
  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath} / ${node.name}` : node.name;
    result.push({
      id: node.id,
      name: node.name,
      fullPath: currentPath,
      childrenCount: node.children?.length || 0,
    });
    if (node.children?.length) {
      result.push(...flattenTree(node.children, currentPath));
    }
  }
  return result;
}

export const FolderExplorerModal: React.FC<FolderExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentFolderId,
  treeData,
  title = 'Choose Destination Folder',
  description = 'Navigate through folders to select your target location',
  excludeId,
  allowRoot = false,
}) => {
  // Navigation level (null = root)
  const [navFolderId, setNavFolderId] = useState<string | null>(() => {
    if (currentFolderId && currentFolderId !== 'root') {
      return currentFolderId;
    }
    return null;
  });

  // Selected destination folder ID
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(() => {
    return currentFolderId || null;
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Breadcrumbs for current navigation level
  const breadcrumbs = useMemo<CrumbItem[]>(() => {
    if (!navFolderId) return [];
    return getBreadcrumbs(treeData, navFolderId) || [];
  }, [treeData, navFolderId]);

  // Current folder node and its children
  const currentNode = useMemo(() => {
    if (!navFolderId) return null;
    return findNode(treeData, navFolderId);
  }, [treeData, navFolderId]);

  // Folders to display at current navigation level
  const visibleFolders = useMemo(() => {
    const rawList = navFolderId ? (currentNode?.children || []) : treeData;
    if (!excludeId) return rawList;
    return rawList.filter((f) => f.id !== excludeId);
  }, [navFolderId, currentNode, treeData, excludeId]);

  // Flat list for search
  const flatFolders = useMemo(() => {
    return flattenTree(treeData).filter((f) => !excludeId || f.id !== excludeId);
  }, [treeData, excludeId]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return flatFolders.filter((f) => f.name.toLowerCase().includes(q) || f.fullPath.toLowerCase().includes(q));
  }, [flatFolders, searchQuery]);

  // Selected folder path string
  const selectedPathString = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === 'root') {
      return '/ (Root)';
    }
    const crumbs = getBreadcrumbs(treeData, selectedFolderId);
    if (!crumbs || crumbs.length === 0) return selectedFolderId;
    return crumbs.map((c) => c.name).join(' / ');
  }, [treeData, selectedFolderId]);

  // Parent ID for "Up" button
  const parentFolderId = useMemo(() => {
    if (!breadcrumbs.length) return null;
    if (breadcrumbs.length === 1) return null; // Root is parent
    return breadcrumbs[breadcrumbs.length - 2].id;
  }, [breadcrumbs]);

  if (!isOpen) return null;

  const handleSelectAndConfirm = () => {
    if (!selectedFolderId) return;
    if (selectedFolderId === 'root') {
      onSelect('root', 'Root Drive', '/');
    } else {
      const node = findNode(treeData, selectedFolderId);
      const name = node ? node.name : selectedFolderId;
      onSelect(selectedFolderId, name, selectedPathString);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explorer-title"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FolderTree className="w-4 h-4" />
              </div>
              <h2 id="explorer-title" className="text-lg font-bold text-slate-900">
                {title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-10">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close folder explorer"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <span className="text-xl leading-none font-semibold">×</span>
          </button>
        </div>

        {/* Toolbar: Search & Breadcrumbs */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter or search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Breadcrumb Path Bar (when not searching) */}
          {!searchQuery && (
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200/70 p-2 rounded-xl overflow-x-auto whitespace-nowrap">
              {/* Up button */}
              <button
                type="button"
                onClick={() => setNavFolderId(parentFolderId)}
                disabled={navFolderId === null}
                className={`p-1 rounded-md transition-colors mr-1 flex items-center ${
                  navFolderId === null 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 cursor-pointer'
                }`}
                title="Up one level"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>

              {/* Root Crumb */}
              <button
                type="button"
                onClick={() => setNavFolderId(null)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  navFolderId === null ? 'font-bold text-indigo-700 bg-indigo-50/70' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <HardDrive className="w-3 h-3 text-slate-400" />
                <span>Drive</span>
              </button>

              {/* Path segments */}
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.id}>
                    <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                    <button
                      type="button"
                      onClick={() => setNavFolderId(crumb.id)}
                      className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                        isLast ? 'font-bold text-indigo-700 bg-indigo-50/70' : 'text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Explorer File Viewport */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[260px] max-h-[360px] bg-white">
          {searchQuery ? (
            /* Search Results Mode */
            searchResults.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                <Search className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No folders match "{searchQuery}"</p>
                <p className="text-xs text-slate-400">Try searching for a different folder name</p>
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((folder) => {
                  const isSelected = selectedFolderId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      onDoubleClick={() => {
                        setSelectedFolderId(folder.id);
                        setNavFolderId(folder.id);
                        setSearchQuery('');
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/80 shadow-2xs'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-800 truncate">{folder.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{folder.fullPath}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNavFolderId(folder.id);
                            setSelectedFolderId(folder.id);
                            setSearchQuery('');
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-white rounded-md border border-slate-200"
                        >
                          Open →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Directory Explorer Mode */
            <div className="space-y-2">
              {/* Allow root option if enabled */}
              {allowRoot && navFolderId === null && (
                <div
                  onClick={() => setSelectedFolderId('root')}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedFolderId === 'root'
                      ? 'border-indigo-500 bg-indigo-50/80 shadow-2xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedFolderId === 'root' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">/ (Root Drive)</p>
                      <p className="text-[10px] text-slate-400">Top level folder</p>
                    </div>
                  </div>
                  {selectedFolderId === 'root' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
              )}

              {/* Current navigated folder selection button */}
              {navFolderId !== null && (
                <div
                  onClick={() => setSelectedFolderId(navFolderId)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer mb-3 ${
                    selectedFolderId === navFolderId
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-2xs'
                      : 'border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Current Location: {currentNode?.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Click here to place items directly in this folder
                      </p>
                    </div>
                  </div>
                  {selectedFolderId === navFolderId ? (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-indigo-600 hover:underline">
                      Select This
                    </span>
                  )}
                </div>
              )}

              {/* Subfolders list */}
              {visibleFolders.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-2">
                    <Folder className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No subfolders inside this location</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                    {navFolderId ? 'You can select this folder as your destination using the button above.' : 'No root folders found.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visibleFolders.map((sub) => {
                    const isSelected = selectedFolderId === sub.id;
                    const childrenCount = sub.children?.length || 0;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedFolderId(sub.id)}
                        onDoubleClick={() => {
                          setNavFolderId(sub.id);
                          setSelectedFolderId(sub.id);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/80 shadow-2xs'
                            : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-amber-100/90 text-amber-700 group-hover:bg-amber-200'}`}>
                            <Folder className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                              {sub.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {childrenCount} {childrenCount === 1 ? 'subfolder' : 'subfolders'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNavFolderId(sub.id);
                              setSelectedFolderId(sub.id);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors"
                            title="Open folder"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Destination Path & Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs truncate max-w-sm">
            <span className="text-slate-400">Target Folder: </span>
            <span className="font-semibold text-indigo-700 truncate">
              {selectedPathString || 'None selected'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSelectAndConfirm}
              disabled={!selectedFolderId}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Select Destination</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

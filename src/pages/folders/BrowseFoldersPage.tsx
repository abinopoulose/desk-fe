import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  FolderClosed, 
  FolderOpen,
  FolderPlus,
  Ticket, 
  Layers, 
  ArrowRight,
  FolderTree,
  Sparkles,
  Plus,
  MoreVertical,
  Edit3,
  Move,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { folderApi } from '../../api/folderApi';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import type { FolderNodeDTO, FolderDTO } from '../../types/folder';
import { ROUTES } from '../../constants';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { FolderExplorerModal } from '../../components/folders/FolderExplorerModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface TicketItem {
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string;
  description?: string;
  folderPath?: string;
  isActive: boolean;
  active?: boolean;
}

export interface CatalogContents {
  folderId: string;
  folderName: string;
  subfolders: FolderDTO[];
  ticketTypes: TicketItem[];
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

const getDepartmentBadgeStyle = (dept: string = '') => {
  const styles = [
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bar: 'bg-indigo-500' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', bar: 'bg-violet-500' },
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: 'bg-blue-500' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: 'bg-rose-500' },
  ];
  let hash = 0;
  for (let i = 0; i < dept.length; i++) {
    hash = dept.charCodeAt(i) + ((hash << 5) - hash);
  }
  return styles[Math.abs(hash) % styles.length];
};

export const BrowseFoldersPage: React.FC<{ isAdminMode?: boolean }> = ({ isAdminMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const rawFolderId = searchParams.get('folderId');
  const folderId = (rawFolderId && rawFolderId !== 'null' && rawFolderId !== 'undefined') ? rawFolderId : null;

  const [treeData, setTreeData] = useState<FolderNodeDTO[]>([]);
  const [allTicketTypes, setAllTicketTypes] = useState<TicketItem[]>([]);
  const [contents, setContents] = useState<CatalogContents | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action Menus
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'rename'>('create');
  const [folderModalTarget, setFolderModalTarget] = useState<FolderDTO | null>(null);
  const [folderInputName, setFolderInputName] = useState('');

  const [moveItem, setMoveItem] = useState<{ id: string; name: string; type: 'folder' | 'ticket' } | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string; type: 'folder' | 'ticket' } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [actionMenu, setActionMenu] = useState<{
    id: string;
    name: string;
    type: 'folder' | 'ticket';
    item: FolderDTO | TicketItem;
    x: number;
    y: number;
  } | null>(null);

  // Close action menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch Tree & Ticket Types & Current Folder
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tree, types] = await Promise.all([
        folderApi.getFolderTree(),
        ticketTypeApi.getTicketTypes(true),
      ]);
      setTreeData(tree);
      setAllTicketTypes(types);

      if (folderId) {
        const folderContents = await folderApi.getFolderContents(folderId);
        setContents(folderContents);
      } else {
        // Synthesize root contents
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
          ticketTypes: types.filter((t) => !t.folderPath || t.folderPath === '/' || t.folderPath === ''),
        });
      }
    } catch (err) {
      console.error('Failed to load catalog data', err);
    } finally {
      setIsLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derive breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!folderId) return [];
    return buildBreadcrumbs(folderId, treeData) || [];
  }, [folderId, treeData]);

  const parentFolder = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
  const parentName = parentFolder ? parentFolder.name : 'All Categories';
  const currentFolderName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : null;

  // Folder Navigation Handlers
  const navigateToFolder = (targetFolderId: string | null) => {
    if (targetFolderId) {
      navigate(`${location.pathname}?folderId=${encodeURIComponent(targetFolderId)}`);
    } else {
      navigate(location.pathname);
    }
  };

  const navigateBack = () => {
    if (breadcrumbs.length <= 1) {
      navigateToFolder(null);
    } else {
      const parentCrumb = breadcrumbs[breadcrumbs.length - 2];
      navigateToFolder(parentCrumb.id);
    }
  };

  // Search logic
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase().trim();
    return allTicketTypes.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.departmentName && t.departmentName.toLowerCase().includes(q)) ||
        (t.folderPath && t.folderPath.toLowerCase().includes(q)),
    );
  }, [searchQuery, allTicketTypes, isSearching]);

  // Folder Actions
  const handleOpenCreateFolder = () => {
    setFolderModalMode('create');
    setFolderModalTarget(null);
    setFolderInputName('');
    setIsFolderModalOpen(true);
    setActionMenu(null);
  };

  const handleOpenRenameFolder = (folder: FolderDTO) => {
    setFolderModalMode('rename');
    setFolderModalTarget(folder);
    setFolderInputName(folder.name);
    setIsFolderModalOpen(true);
    setActionMenu(null);
  };

  const handleSaveFolder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!folderInputName.trim()) return;
    setIsActionLoading(true);
    try {
      if (folderModalMode === 'create') {
        await folderApi.createFolder({
          name: folderInputName.trim(),
          parentId: folderId || undefined,
        });
      } else if (folderModalTarget) {
        await folderApi.updateFolder(folderModalTarget.id, {
          name: folderInputName.trim(),
          parentId: folderModalTarget.parentId ?? undefined,
        });
      }
      setIsFolderModalOpen(false);
      setFolderInputName('');
      setFolderModalTarget(null);
      await loadData();
    } catch (err) {
      console.error('Failed to save folder', err);
      alert('Failed to save folder. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Move Actions
  const handleOpenMove = (item: { id: string; name: string; type: 'folder' | 'ticket' }) => {
    setMoveItem(item);
    setIsMoveModalOpen(true);
    setActionMenu(null);
  };

  const handleMoveSelect = async (targetFolderId: string) => {
    if (!moveItem) return;
    setIsActionLoading(true);
    try {
      if (moveItem.type === 'folder') {
        await folderApi.updateFolder(moveItem.id, {
          name: moveItem.name,
          parentId: targetFolderId === 'root' ? undefined : targetFolderId,
          moveToRoot: targetFolderId === 'root',
        });
      } else {
        if (targetFolderId === 'root') {
          alert('Ticket types must be placed inside a specific folder, not the root level.');
          setIsActionLoading(false);
          return;
        }
        const full = await ticketTypeApi.getTicketTypeById(moveItem.id);
        await ticketTypeApi.updateTicketType(moveItem.id, {
          title: full.title,
          description: full.description,
          folderId: targetFolderId,
          departmentId: full.departmentId,
          formSchema: (full.formSchema || {}) as Record<string, unknown>,
          isActive: full.isActive ?? full.active ?? true,
        });
      }
      setIsMoveModalOpen(false);
      setMoveItem(null);
      await loadData();
    } catch (err) {
      console.error('Failed to move item', err);
      alert('Failed to move item. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Actions
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setIsActionLoading(true);
    try {
      if (deleteItem.type === 'folder') {
        await folderApi.deleteFolder(deleteItem.id);
      } else {
        await ticketTypeApi.deleteTicketType(deleteItem.id);
      }
      setDeleteItem(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete item', err);
      alert('Failed to delete item. Ensure folders are empty before removing.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <PrivilegeGate requiredPrivilege={isAdminMode ? 'TICKET_TYPE_EDIT' : undefined}>
      <div className="min-h-full bg-slate-50 text-slate-800 flex flex-col">
        {/* Top Header Card */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-6 lg:px-10 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Admin Console
                </span>
                <span className="text-xs text-slate-400 font-medium">• Service Catalog Master</span>
              </div>
              
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {currentFolderName ? currentFolderName : 'All Ticket Categories'}
              </h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Organize service catalog categories, configure form schema questions, SLA resolution targets, and lifecycle statuses.
              </p>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72 lg:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search forms or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300/80 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-9 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition-colors"
                  >
                    <span className="text-sm leading-none font-bold">×</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCreateFolder}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                  <span>New Folder</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(folderId ? `${ROUTES.ADMIN.TICKET_TYPE_NEW}?folderId=${folderId}` : ROUTES.ADMIN.TICKET_TYPE_NEW)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Ticket Type</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-w-7xl mx-auto px-6 py-8 lg:px-10 flex-1 w-full flex flex-col">
          
          {/* Breadcrumbs & Navigation Bar */}
          {!isSearching && (
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                {folderId !== null && (
                  <button
                    type="button"
                    onClick={navigateBack}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-indigo-600 text-xs font-medium rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Return to {parentName}</span>
                  </button>
                )}

                {/* Breadcrumb Path */}
                <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 bg-white/80 border border-slate-200/70 px-3 py-1.5 rounded-lg shadow-2xs">
                  <button
                    type="button"
                    onClick={() => navigateToFolder(null)}
                    className="font-medium hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                    <span>All Categories</span>
                  </button>
                  {breadcrumbs.map((crumb, idx) => {
                    const isLast = idx === breadcrumbs.length - 1;
                    return (
                      <React.Fragment key={crumb.id}>
                        <ChevronRight className="w-3 h-3 text-slate-300 mx-1 shrink-0" />
                        <button
                          type="button"
                          onClick={() => navigateToFolder(crumb.id)}
                          disabled={isLast}
                          className={`transition-colors cursor-pointer ${
                            isLast
                              ? 'font-semibold text-slate-800 pointer-events-none'
                              : 'font-medium text-slate-500 hover:text-indigo-600'
                          }`}
                        >
                          {crumb.name}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </nav>
              </div>

              {contents && (
                <div className="text-xs text-slate-400 font-medium">
                  {contents.subfolders.length} {contents.subfolders.length === 1 ? 'Category' : 'Categories'} • {contents.ticketTypes.length} {contents.ticketTypes.length === 1 ? 'Form' : 'Forms'}
                </div>
              )}
            </div>
          )}

          {/* SKELETON LOADING STATE */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-44 border border-slate-200 p-5 flex flex-col shadow-xs">
                  <div className="h-5 w-1/3 bg-slate-100 rounded mb-3"></div>
                  <div className="h-6 w-3/4 bg-slate-100 rounded mb-2"></div>
                  <div className="h-4 w-full bg-slate-100 rounded mb-1"></div>
                  <div className="h-4 w-2/3 bg-slate-100 rounded mb-4"></div>
                  <div className="mt-auto h-5 w-1/2 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : isSearching ? (
            /* SEARCH RESULTS VIEW */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span>Search Results</span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-indigo-100">
                    {searchResults.length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-medium cursor-pointer"
                >
                  Clear Search
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">No matching ticket types found</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    No ticket forms matched "{searchQuery}". Check the spelling or search across categories.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  <AnimatePresence>
                    {searchResults.map((type, index) => (
                      <AdminTicketTypeCard
                        key={type.id}
                        type={type}
                        index={index}
                        onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPE_EDIT(type.id))}
                        onMenuClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActionMenu({ id: type.id, name: type.title, type: 'ticket', item: type, x: rect.right, y: rect.bottom });
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : (
            /* MAIN CATEGORIES & TICKET TEMPLATES VIEW */
            <div className="space-y-10">
              {/* SUBFOLDERS / CATEGORIES */}
              {contents && contents.subfolders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Categories & Sub-Folders</span>
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      {contents.subfolders.length} {contents.subfolders.length === 1 ? 'folder' : 'folders'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence>
                      {contents.subfolders.map((sub, index) => (
                        <AdminFolderCard
                          key={sub.id}
                          folder={sub}
                          index={index}
                          onClick={() => navigateToFolder(sub.id)}
                          onMenuClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActionMenu({ id: sub.id, name: sub.name, type: 'folder', item: sub, x: rect.right, y: rect.bottom });
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* TICKET TYPES */}
              {contents && contents.ticketTypes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-slate-400" />
                      <span>Configured Ticket Forms</span>
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      {contents.ticketTypes.length} {contents.ticketTypes.length === 1 ? 'form' : 'forms'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    <AnimatePresence>
                      {contents.ticketTypes.map((type, index) => (
                        <AdminTicketTypeCard
                          key={type.id}
                          type={type}
                          index={index}
                          onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPE_EDIT(type.id))}
                          onMenuClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActionMenu({ id: type.id, name: type.title, type: 'ticket', item: type, x: rect.right, y: rect.bottom });
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* EMPTY FOLDER STATE */}
              {contents && contents.subfolders.length === 0 && contents.ticketTypes.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center mb-4">
                    <FolderOpen className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">This category is empty</h3>
                  <p className="text-sm text-slate-500 max-w-sm mb-6">
                    No sub-categories or ticket forms have been configured in this folder yet.
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenCreateFolder}
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                      <span>Add Sub-Folder</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(folderId ? `${ROUTES.ADMIN.TICKET_TYPE_NEW}?folderId=${folderId}` : ROUTES.ADMIN.TICKET_TYPE_NEW)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Ticket Type</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FLOATING ACTION MENU */}
        {actionMenu && (
          <div
            className="fixed bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 z-50 min-w-[190px] animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: Math.min(actionMenu.y + 4, window.innerHeight - 200),
              left: Math.max(16, Math.min(actionMenu.x - 180, window.innerWidth - 210)),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {actionMenu.type === 'folder' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenRenameFolder(actionMenu.item as FolderDTO)}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename Folder</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenMove({ id: actionMenu.id, name: actionMenu.name, type: 'folder' })}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Move className="w-3.5 h-3.5 text-slate-400" />
                  <span>Move Folder</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setDeleteItem({ id: actionMenu.id, name: actionMenu.name, type: 'folder' });
                    setActionMenu(null);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Folder</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPE_EDIT(actionMenu.id))}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Configuration</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.ADMIN.TICKET_STATUSES(actionMenu.id))}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manage Statuses</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenMove({ id: actionMenu.id, name: actionMenu.name, type: 'ticket' })}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Move className="w-3.5 h-3.5 text-slate-400" />
                  <span>Move to Folder</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setDeleteItem({ id: actionMenu.id, name: actionMenu.name, type: 'ticket' });
                    setActionMenu(null);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Ticket Type</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* FOLDER CREATE / RENAME MODAL */}
        {isFolderModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200" role="dialog" aria-modal="true">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {folderModalMode === 'create' ? 'Create New Category Folder' : 'Rename Folder'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {folderModalMode === 'create'
                      ? `Create folder inside ${currentFolderName || 'All Categories'}`
                      : `Update display name for this folder`}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveFolder} className="space-y-4">
                <div>
                  <label htmlFor="folderName" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Folder Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="folderName"
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. IT Equipment, Facilities, Payroll"
                    value={folderInputName}
                    onChange={(e) => setFolderInputName(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFolderModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    disabled={isActionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading || !folderInputName.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isActionLoading ? 'Saving...' : folderModalMode === 'create' ? 'Create Folder' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MOVE MODAL (FolderExplorerModal) */}
        <FolderExplorerModal
          isOpen={isMoveModalOpen}
          onClose={() => {
            setIsMoveModalOpen(false);
            setMoveItem(null);
          }}
          onSelect={(targetId) => handleMoveSelect(targetId)}
          treeData={treeData}
          excludeId={moveItem?.type === 'folder' ? moveItem.id : undefined}
          allowRoot={true}
          title={`Move ${moveItem?.type === 'folder' ? 'Folder' : 'Ticket Type'}`}
          description={`Select destination category for "${moveItem?.name || ''}"`}
        />

        {/* DELETE CONFIRMATION DIALOG */}
        <ConfirmDialog
          open={Boolean(deleteItem)}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete ${deleteItem?.type === 'folder' ? 'Folder' : 'Ticket Type'}?`}
          description={
            deleteItem?.type === 'folder'
              ? `Are you sure you want to delete the folder "${deleteItem?.name}"? Make sure it contains no active sub-categories or ticket forms.`
              : `Are you sure you want to delete the ticket form "${deleteItem?.name}"? This action cannot be undone.`
          }
          confirmLabel="Delete Permanently"
          cancelLabel="Cancel"
          severity="danger"
          loading={isActionLoading}
        />
      </div>
    </PrivilegeGate>
  );
};

/** Physical Archive Folder Card component with Admin 3-dot Action Menu */
const AdminFolderCard = ({
  folder,
  index,
  onClick,
  onMenuClick,
}: {
  folder: FolderDTO;
  index: number;
  onClick: () => void;
  onMenuClick: (e: React.MouseEvent) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      aria-label={`Open folder ${folder.name}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="relative cursor-pointer group pt-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl select-none"
    >
      {/* Physical Folder Tab cutout */}
      <div className="absolute top-0 left-3 w-2/5 h-3 bg-amber-200/90 group-hover:bg-amber-300 rounded-t-md border-t border-x border-amber-300/80 transition-colors z-0" />

      {/* Main Folder Body with soft warm paper tone & subtle embossed edge */}
      <div className="relative z-10 bg-gradient-to-b from-amber-50/90 to-amber-100/70 group-hover:from-amber-50 group-hover:to-amber-100 rounded-2xl rounded-tl-none p-4.5 border border-amber-200/90 group-hover:border-amber-300 shadow-xs group-hover:shadow-md transition-all flex flex-col justify-between min-h-[135px]">
        
        <div className="flex items-start justify-between gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-200/70 group-hover:bg-amber-200 flex items-center justify-center text-amber-800 transition-colors shadow-2xs">
            <FolderClosed className="w-5 h-5 group-hover:scale-105 transition-transform" />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800/60 bg-amber-200/40 px-1.5 py-0.5 rounded">
              Folder
            </span>
            <button
              type="button"
              aria-label="Folder Options"
              onClick={onMenuClick}
              className="p-1 rounded-lg text-amber-800/60 hover:text-amber-900 hover:bg-amber-200/60 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <span className="font-semibold text-slate-800 text-sm line-clamp-2 group-hover:text-amber-950 transition-colors">
            {folder.name}
          </span>
          <span className="text-[11px] text-amber-800/60 font-medium group-hover:text-amber-800 mt-0.5 flex items-center gap-1">
            <span>Open Category</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/** Modern Ticket Type Card component with Admin 3-dot Action Menu */
const AdminTicketTypeCard = ({
  type,
  index,
  onClick,
  onMenuClick,
}: {
  type: TicketItem;
  index: number;
  onClick: () => void;
  onMenuClick: (e: React.MouseEvent) => void;
}) => {
  const badgeStyle = getDepartmentBadgeStyle(type.departmentName);
  const isActive = type.isActive ?? type.active ?? true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      aria-label={`Configure ticket type ${type.title}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`cursor-pointer relative bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 group select-none overflow-hidden ${
        isActive ? 'border-slate-200/90 hover:border-indigo-300' : 'border-dashed border-slate-300/80 bg-slate-50/50 opacity-80'
      }`}
    >
      {/* Top Department Color Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${badgeStyle.bar}`} />

      <div>
        {/* Header row: Department badge & Action Menu */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
              {type.departmentName || 'General'}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isActive ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> : <AlertCircle className="w-2.5 h-2.5 text-slate-400" />}
              <span>{isActive ? 'Active' : 'Draft'}</span>
            </span>
          </div>

          <button
            type="button"
            aria-label="Ticket Type Options"
            onClick={onMenuClick}
            className="p-1 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Ticket Form Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-1.5 line-clamp-2">
          {type.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {type.description || 'Configured ticket template form for staff submissions.'}
        </p>
      </div>

      {/* Footer details: Folder location and Action CTA */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto text-xs">
        <span className="text-[11px] text-slate-400 truncate max-w-[140px]" title={type.folderPath || 'Root Category'}>
          {type.folderPath || 'Root'}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-700">
          <span>Configure</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </motion.div>
  );
};

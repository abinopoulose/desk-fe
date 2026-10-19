import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { DataGridSkeleton } from "../common/Skeletons";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { folderApi } from '../../api/folderApi';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import type { FolderContentsDTO } from '../../types/folder';
import { ROUTES } from '../../constants';
import { MoreVertical, Edit2, FolderInput, Trash2 } from 'lucide-react';
import { FolderExplorerModal } from './FolderExplorerModal';

interface FolderContentsProps {
  folderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  isAdminMode?: boolean;
  breadcrumbs?: {id: string, name: string}[] | null;
  onNewClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  rootFolders?: {id: string, name: string}[];
  treeData?: any[];
}

export const FolderContents: React.FC<FolderContentsProps> = ({ folderId, onSelectFolder, isAdminMode = false, breadcrumbs, onNewClick, onContextMenu, rootFolders, treeData = [] }) => {
  const [contents, setContents] = useState<FolderContentsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [actionMenu, setActionMenu] = useState<{ id: string, type: 'folder' | 'ticket', name: string, parentId?: string | null, x: number, y: number } | null>(null);
  const [renameItem, setRenameItem] = useState<{ id: string, type: 'folder' | 'ticket', name: string, parentId?: string | null } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string, type: 'folder' | 'ticket', name: string } | null>(null);
  const [moveItem, setMoveItem] = useState<{ id: string, type: 'folder' | 'ticket', name: string, parentId?: string | null } | null>(null);

  const [newName, setNewName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchContents = async () => {
    if (!folderId) {
      setContents({
        folderId: 'root',
        folderName: '/',
        subfolders: (rootFolders || []).map(f => ({ ...f, parentId: null, createdAt: '', updatedAt: '' })),
        ticketTypes: []
      });
      setIsLoading(false);
      setError(null);
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
  };

  useEffect(() => {
    fetchContents();
  }, [folderId, rootFolders]);

  const handleRename = async () => {
    if (!renameItem || !newName.trim()) return;
    setActionLoading(true);
    try {
      if (renameItem.type === 'folder') {
        await folderApi.updateFolder(renameItem.id, { 
          name: newName.trim(),
          parentId: renameItem.parentId ?? (folderId && folderId !== 'root' ? folderId : undefined),
        });
        setRenameItem(null);
        fetchContents();
        window.location.reload(); // Refresh tree
      } else {
        // For ticket types, we navigate to edit page because we need the full payload to save safely
        navigate(ROUTES.ADMIN.TICKET_TYPE_EDIT(renameItem.id));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to rename');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async (targetFolderId: string) => {
    if (!moveItem) return;
    setActionLoading(true);
    try {
      if (moveItem.type === 'folder') {
        await folderApi.updateFolder(moveItem.id, { 
          name: moveItem.name, 
          parentId: targetFolderId === 'root' ? undefined : targetFolderId,
          moveToRoot: targetFolderId === 'root',
        });
        setMoveItem(null);
        fetchContents();
        window.location.reload();
      } else {
        const existingType = await ticketTypeApi.getTicketTypeById(moveItem.id);
        await ticketTypeApi.updateTicketType(moveItem.id, {
          title: existingType.title,
          description: existingType.description,
          folderId: targetFolderId,
          departmentId: existingType.departmentId,
          formSchema: existingType.formSchema as Record<string, unknown>,
          isActive: existingType.isActive,
        });
        setMoveItem(null);
        fetchContents();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to move');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setActionLoading(true);
    try {
      if (deleteItem.type === 'folder') {
        await folderApi.deleteFolder(deleteItem.id);
      } else {
        await ticketTypeApi.deleteTicketType(deleteItem.id);
      }
      setDeleteItem(null);
      fetchContents();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const handleClick = () => setActionMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (isLoading && !contents) {
    return (
      <div className="p-6">
        <DataGridSkeleton rows={6} columns={4} />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!contents) return null;

  const fallbackPath = (contents.ticketTypes.length > 0 && contents.ticketTypes[0].folderPath)
    ? contents.ticketTypes[0].folderPath.split('/').filter(Boolean).map(p => ({ id: '', name: p }))
    : [{ id: folderId || '', name: contents.folderName || 'Folder' }];

  const currentPath = breadcrumbs || (folderId ? fallbackPath : []);
  const fullPath = [{ id: 'root', name: '/' }, ...currentPath];

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="px-6 py-4 flex items-center justify-between bg-slate-50 border-b border-slate-100">
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          {fullPath.map((part, index, arr) => {
            const isLast = index === arr.length - 1;
            return isLast ? (
              <Typography key={index} color="text.primary" sx={{ fontWeight: 600 }}>
                {part.name}
              </Typography>
            ) : (
              <MuiLink
                key={index}
                underline="hover"
                color="inherit"
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  if (part.id === 'root') onSelectFolder(null);
                  else if (part.id) onSelectFolder(part.id);
                }}
              >
                {part.name}
              </MuiLink>
            );
          })}
        </Breadcrumbs>
        
        {isAdminMode && onNewClick && (
          <button 
            onClick={onNewClick}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
            title="Create New"
          >
            <span className="text-lg leading-none mt-[-2px]">+</span> New
          </button>
        )}
      </div>

      <div className="px-6 py-6 overflow-y-auto flex-1 relative" onContextMenu={onContextMenu}>
        {contents.subfolders.length === 0 && contents.ticketTypes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20 pointer-events-none">
            <svg className="w-24 h-24 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
            <p className="text-lg">This folder is empty</p>
            {isAdminMode && <p className="text-sm mt-2">Right-click to add a ticket type or folder</p>}
          </div>
        )}

        {contents.subfolders.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {contents.subfolders.map(sub => (
                <div 
                  key={sub.id}
                  onClick={() => onSelectFolder(sub.id)}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors bg-white group"
                >
                  <div className="flex items-center overflow-hidden">
                    <svg className="w-6 h-6 text-gray-500 mr-3 group-hover:text-gray-700 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>
                    <span className="font-medium text-gray-700 truncate text-sm">{sub.name}</span>
                  </div>
                  {isAdminMode && (
                    <button 
                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all text-gray-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActionMenu({ 
                          id: sub.id, 
                          type: 'folder', 
                          name: sub.name, 
                          parentId: sub.parentId ?? (folderId && folderId !== 'root' ? folderId : null),
                          x: rect.right, 
                          y: rect.bottom 
                        });
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {contents.ticketTypes.length > 0 && (
          <div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {contents.ticketTypes.map(type => (
                <div 
                  key={type.id}
                  onClick={() => navigate(isAdminMode ? ROUTES.ADMIN.TICKET_TYPE_EDIT(type.id) : `${ROUTES.TICKETS.NEW}?typeId=${type.id}`)}
                  className={`flex flex-col border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white overflow-hidden group relative ${type.isActive ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-75'}`}
                >
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                        <h4 className="font-medium text-gray-800 text-sm line-clamp-2">
                          {type.title}
                        </h4>
                      </div>
                      {isAdminMode && (
                        <button 
                          className="p-1 -mt-1 -mr-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all text-gray-500 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActionMenu({ id: type.id, type: 'ticket', name: type.title, x: rect.right, y: rect.bottom });
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500 truncate">{type.departmentName}</span>
                      {!(type.isActive ?? type.active) && isAdminMode && (
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">INACTIVE</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {actionMenu && (
        <div 
          className="fixed bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 min-w-[180px] transition-all animate-in fade-in zoom-in-95 duration-100"
          style={{ 
            top: actionMenu.y + 120 > window.innerHeight ? window.innerHeight - 120 : actionMenu.y + 5, 
            left: actionMenu.x - 180 > 0 ? actionMenu.x - 180 : actionMenu.x 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2">
            <button 
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md flex items-center gap-3 transition-colors"
              onClick={() => {
                if (actionMenu.type === 'ticket') {
                  navigate(ROUTES.ADMIN.TICKET_TYPE_EDIT(actionMenu.id));
                } else {
                  setRenameItem(actionMenu);
                  setNewName(actionMenu.name);
                }
                setActionMenu(null);
              }}
            >
              <Edit2 className="w-4 h-4 text-slate-500" /> Rename
            </button>
            <button 
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md flex items-center gap-3 transition-colors"
              onClick={() => {
                setMoveItem(actionMenu);
                setActionMenu(null);
              }}
            >
              <FolderInput className="w-4 h-4 text-slate-500" /> Move
            </button>
            <div className="h-px bg-slate-100 my-1 mx-1"></div>
            <button 
              className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md flex items-center gap-3 transition-colors"
              onClick={() => {
                setDeleteItem(actionMenu);
                setActionMenu(null);
              }}
            >
              <Trash2 className="w-4 h-4 text-red-500" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-5">Rename {renameItem.type}</h3>
            <input 
              type="text" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-md px-3 py-2 outline-none"
              autoFocus
              onKeyDown={(e) => { if(e.key === 'Enter') handleRename(); if(e.key === 'Escape') setRenameItem(null); }}
            />
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setRenameItem(null)} className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-50 rounded-full">Cancel</button>
              <button onClick={handleRename} disabled={actionLoading} className="px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-full hover:bg-indigo-700">
                {actionLoading ? 'Saving...' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal (Real File Explorer Navigator) */}
      <FolderExplorerModal
        isOpen={Boolean(moveItem)}
        onClose={() => setMoveItem(null)}
        onSelect={(targetId) => handleMove(targetId)}
        currentFolderId={folderId}
        treeData={treeData}
        title={`Move ${moveItem?.type === 'folder' ? 'Folder' : 'Ticket Type'}: ${moveItem?.name || ''}`}
        description="Navigate to the destination folder and click Select Destination"
        excludeId={moveItem?.type === 'folder' ? moveItem.id : undefined}
        allowRoot={moveItem?.type === 'folder'}
      />

      {/* Delete Modal */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Delete {deleteItem.type}?</h3>
            </div>
            <p className="text-slate-600 mb-6">Are you sure you want to delete "{deleteItem.name}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-50 rounded-full">Cancel</button>
              <button onClick={handleDelete} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-full hover:bg-red-700">
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

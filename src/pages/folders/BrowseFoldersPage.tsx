import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router';
import { FolderTreeNav } from '../../components/folders/FolderTreeNav';
import { FolderContents } from '../../components/folders/FolderContents';
import { useAuth } from '../../store/authStore';
import { ROUTES } from '../../constants';
import { folderApi } from '../../api/folderApi';

export const BrowseFoldersPage: React.FC<{ isAdminMode?: boolean }> = ({ isAdminMode = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folderId');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { hasPrivilege } = useAuth();
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(true);

  useEffect(() => {
    setPortalTarget(document.getElementById('header-portal-target'));
  }, []);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setIsTreeLoading(true);
        const data = await folderApi.getFolderTree();
        setTreeData(data);
      } catch (err) {
        console.error('Failed to load tree', err);
      } finally {
        setIsTreeLoading(false);
      }
    };
    fetchTree();
  }, [refreshKey]);

  const getFolderPath = (nodes: any[], targetId: string, currentPath: {id: string, name: string}[] = []): {id: string, name: string}[] | null => {
    for (const node of nodes) {
      const path = [...currentPath, { id: node.id, name: node.name }];
      if (node.id === targetId) return path;
      if (node.children) {
        const found = getFolderPath(node.children, targetId, path);
        if (found) return found;
      }
    }
    return null;
  };

  const breadcrumbs = folderId && !isTreeLoading ? getFolderPath(treeData, folderId) : null;

  const handleSelectFolder = (id: string | null) => {
    if (id) {
      setSearchParams({ folderId: id });
    } else {
      searchParams.delete('folderId');
      setSearchParams(searchParams);
    }
    setIsSidebarOpen(false);
  };


  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await folderApi.createFolder({ name: newFolderName, parentId: folderId || undefined });
      setNewFolderName('');
      setIsCreatingFolder(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to create folder', err);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isAdminMode || !hasPrivilege('TICKET_TYPE_WRITE')) return;
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY });
  };

  const handleNewClick = (e: React.MouseEvent) => {
    if (!isAdminMode || !hasPrivilege('TICKET_TYPE_WRITE')) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + 8 });
  };

  const handleClickOutside = () => {
    if (contextMenu) setContextMenu(null);
  };

  useEffect(() => {
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const headerContent = (
    <div className="flex items-center justify-between w-full pr-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-slate-800">{isAdminMode ? 'Ticket Master' : 'Browse Ticket Types'}</h1>
      </div>
    </div>
  );

  return (
    <div 
      className="absolute top-16 left-0 right-0 bottom-0 bg-white flex flex-col overflow-hidden z-0" 
    >
      {portalTarget && createPortal(headerContent, portalTarget)}

      {isCreatingFolder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <h3 className="text-lg font-medium text-slate-900 mb-5">New folder</h3>
            <input 
              type="text" 
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Untitled folder"
              className="w-full border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-md px-3 py-2 outline-none transition-shadow"
              autoFocus
              onKeyDown={(e) => { if(e.key === 'Enter') handleCreateFolder(); if(e.key === 'Escape') setIsCreatingFolder(false); }}
            />
            <div className="flex justify-end gap-1 mt-6">
              <button 
                onClick={() => setIsCreatingFolder(false)} 
                className="px-4 py-2 text-indigo-600 font-medium text-sm rounded-full hover:bg-indigo-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFolder} 
                className="px-4 py-2 text-indigo-600 font-medium text-sm rounded-full hover:bg-indigo-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className={`
          fixed md:static inset-y-0 left-0 z-30
          w-64 bg-slate-50 border-r border-slate-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="px-4 pt-4 pb-2 text-sm font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            Drive
            <button 
              className="md:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setIsSidebarOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <FolderTreeNav 
              key={`tree-${refreshKey}`}
              activeFolderId={folderId} 
              onSelectFolder={handleSelectFolder}
              treeData={treeData}
              isLoading={isTreeLoading}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <FolderContents 
            key={`contents-${refreshKey}-${folderId || 'root'}`}
            folderId={folderId} 
            onSelectFolder={handleSelectFolder}
            isAdminMode={isAdminMode}
            breadcrumbs={breadcrumbs}
            onNewClick={(e) => { e.stopPropagation(); handleNewClick(e); }}
            onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e); }}
            rootFolders={treeData.map(node => ({ id: node.id, name: node.name }))}
            treeData={treeData}
          />
        </div>
      </div>

      {contextMenu && (
        <div 
          className="fixed bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 min-w-[220px] transition-all animate-in fade-in zoom-in-95 duration-100"
          style={{ 
            ...(contextMenu.y + 100 > window.innerHeight 
              ? { bottom: window.innerHeight - contextMenu.y } 
              : { top: contextMenu.y }),
            ...(contextMenu.x + 220 > window.innerWidth 
              ? { right: window.innerWidth - contextMenu.x } 
              : { left: contextMenu.x })
          }}
        >
          <div className="px-2">
            <button 
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md flex items-center gap-3 transition-colors"
              onClick={() => { setIsCreatingFolder(true); setContextMenu(null); }}
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
              New folder
            </button>
            <div className="h-px bg-slate-100 my-1 mx-1"></div>
            <button 
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md flex items-center gap-3 transition-colors"
              onClick={() => { navigate(folderId ? `${ROUTES.ADMIN.TICKET_TYPE_NEW}?folderId=${folderId}` : ROUTES.ADMIN.TICKET_TYPE_NEW); setContextMenu(null); }}
            >
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              New ticket type
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

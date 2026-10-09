import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { createPortal } from 'react-dom';
import { folderApi } from '../../api/folderApi';
import type { FolderNodeDTO } from '../../types/folder';
import { ROUTES } from '../../constants';
import { useAuth } from '../../store/authStore';
import { FolderTreeNav } from "../../components/folders/FolderTreeNav";
import { FolderContents } from "../../components/folders/FolderContents";

import { Box, Drawer, SwipeableDrawer, IconButton, Typography, Button, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon, Add as AddIcon, CreateNewFolder as CreateNewFolderIcon } from '@mui/icons-material';

export const BrowseFoldersPage: React.FC<{isAdminMode?: boolean}> = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { hasPrivilege } = useAuth();
  const isAdminMode = hasPrivilege('DEPARTMENT_WRITE');

  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folderId');

  const [treeData, setTreeData] = useState<FolderNodeDTO[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    setPortalTarget(document.getElementById('header-actions'));
  }, []);

  useEffect(() => {
    const fetchTree = async () => {
      setIsTreeLoading(true);
      try {
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
    if (isMobile) setIsDrawerOpen(false);
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
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleNewClick = (e: React.MouseEvent) => {
    if (!isAdminMode || !hasPrivilege('TICKET_TYPE_WRITE')) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + 8 });
  };

  const toggleDrawer = (open: boolean) => (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e && e.type === 'keydown' && ((e as React.KeyboardEvent).key === 'Tab' || (e as React.KeyboardEvent).key === 'Shift')) return;
    setIsDrawerOpen(open);
  };

  const sidebarWidth = 280;

  const sidebarContent = (
    <Box sx={{ width: sidebarWidth, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="overline" sx={{ fontWeight: 600 }}>Drive</Typography>
        {isMobile && (
          <IconButton size="small" onClick={() => setIsDrawerOpen(false)}>
            <Typography variant="h6" sx={{ lineHeight: 1 }}>×</Typography>
          </IconButton>
        )}
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
        <FolderTreeNav
          key={`tree-${refreshKey}`}
          activeFolderId={folderId}
          onSelectFolder={handleSelectFolder}
          treeData={treeData}
          isLoading={isTreeLoading}
        />
      </Box>
    </Box>
  );

  const headerContent = (
    <div className="flex items-center justify-between w-full pr-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-slate-800">{isAdminMode ? 'Ticket Master' : 'Browse Ticket Types'}</h1>
      </div>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', bgcolor: 'background.default', position: 'relative' }}>
      {portalTarget && createPortal(headerContent, portalTarget)}

      {/* Mobile Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={isDrawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        ModalProps={{ keepMounted: true }}
      >
        {sidebarContent}
      </SwipeableDrawer>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: sidebarWidth, boxSizing: 'border-box', position: 'relative' },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <IconButton onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 500 }}>
              Browse Folders
            </Typography>
          </Box>
        )}

        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <FolderContents
            key={`contents-${refreshKey}-${folderId || 'root'}`}
            folderId={folderId}
            onSelectFolder={handleSelectFolder}
            isAdminMode={isAdminMode}
            breadcrumbs={breadcrumbs}
            onNewClick={(e: React.MouseEvent) => { e.stopPropagation(); handleNewClick(e); }}
            onContextMenu={handleContextMenu}
            rootFolders={treeData.map(node => ({ id: node.id, name: node.name }))}
            treeData={treeData}
          />
        </Box>
      </Box>

      {/* Context Menu equivalent logic */}
      {contextMenu && (
        <>
          <Box
            sx={{ position: 'fixed', inset: 0, zIndex: 1299 }}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
          />
          <Box
            sx={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              bgcolor: 'background.paper',
              boxShadow: 3,
              borderRadius: 1,
              zIndex: 1300,
              minWidth: 200,
              py: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              fullWidth
              sx={{ justifyContent: 'flex-start', px: 2, color: 'text.primary', textTransform: 'none' }}
              startIcon={<CreateNewFolderIcon />}
              onClick={() => { setIsCreatingFolder(true); setContextMenu(null); }}
            >
              New folder
            </Button>
            <Box sx={{ my: 0.5, borderBottom: 1, borderColor: 'divider' }} />
            <Button
              fullWidth
              sx={{ justifyContent: 'flex-start', px: 2, color: 'primary.main', textTransform: 'none' }}
              startIcon={<AddIcon />}
              onClick={() => { navigate(folderId ? `${ROUTES.ADMIN.TICKET_TYPE_NEW}?folderId=${folderId}` : ROUTES.ADMIN.TICKET_TYPE_NEW); setContextMenu(null); }}
            >
              New ticket type
            </Button>
          </Box>
        </>
      )}

      {/* Create Folder Modal */}
      {isCreatingFolder && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 3, width: '100%', maxWidth: 400 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>New folder</Typography>
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Untitled folder"
              className="w-full border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-md px-3 py-2 outline-none"
              autoFocus
              onKeyDown={(e) => { if(e.key === 'Enter') handleCreateFolder(); if(e.key === 'Escape') setIsCreatingFolder(false); }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button onClick={() => setIsCreatingFolder(false)} sx={{ borderRadius: 20, textTransform: 'none' }}>Cancel</Button>
              <Button onClick={handleCreateFolder} variant="contained" sx={{ borderRadius: 20, textTransform: 'none' }}>Create</Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

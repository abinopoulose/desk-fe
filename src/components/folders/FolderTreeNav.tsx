import { FolderTreeSkeleton } from '../common/Skeletons';
import React, { useEffect, useState } from 'react';
import type { FolderNodeDTO } from '../../types/folder';
import { Box, Typography, Collapse } from '@mui/material';
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface FolderTreeNavProps {
  onSelectFolder: (folderId: string) => void;
  activeFolderId: string | null;
  treeData: FolderNodeDTO[];
  isLoading?: boolean;
}

interface TreeNodeProps {
  node: FolderNodeDTO;
  activeFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, activeFolderId, onSelectFolder, level }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = activeFolderId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  useEffect(() => {
    if (activeFolderId && hasChildren) {
      const hasActiveChild = (n: FolderNodeDTO): boolean => {
        if (n.id === activeFolderId) return true;
        return n.children?.some((c) => hasActiveChild(c)) || false;
      };
      if (node.children?.some((c) => hasActiveChild(c))) {
        setIsExpanded(true);
      }
    }
  }, [activeFolderId, node, hasChildren]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectFolder(node.id);
    if (!isExpanded && hasChildren) setIsExpanded(true);
  };

  return (
    <Box role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <Box
        onClick={handleSelect}
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          pr: 1,
          pl: level * 2 + 1,
          cursor: 'pointer',
          borderRadius: 1,
          mb: '2px',
          bgcolor: isActive ? 'primary.50' : 'transparent',
          color: isActive ? 'primary.main' : 'text.secondary',
          '&:hover': { bgcolor: isActive ? 'primary.50' : 'action.hover' },
        }}
      >
        <Box
          onClick={hasChildren ? handleToggle : undefined}
          sx={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 0.5,
            visibility: hasChildren ? 'visible' : 'hidden',
            cursor: hasChildren ? 'pointer' : 'default',
            '&:hover': hasChildren ? { bgcolor: 'action.hover', borderRadius: 1 } : {},
          }}
        >
          {isExpanded ? (
            <ExpandMoreIcon fontSize="small" sx={{ color: 'action.active' }} />
          ) : (
            <ChevronRightIcon fontSize="small" sx={{ color: 'action.active' }} />
          )}
        </Box>

        {isExpanded && hasChildren ? (
          <FolderOpenIcon fontSize="small" sx={{ mr: 1, color: isActive ? 'primary.main' : 'action.active' }} />
        ) : (
          <FolderIcon fontSize="small" sx={{ mr: 1, color: isActive ? 'primary.main' : 'action.active' }} />
        )}

        <Typography variant="body2" sx={{ fontWeight: isActive ? 600 : 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </Typography>
      </Box>

      {hasChildren && (
        <Collapse in={isExpanded} unmountOnExit>
          <Box role="group" sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                left: (level + 1) * 16 + 10,
                top: 0,
                bottom: 0,
                borderLeft: 1,
                borderColor: 'divider',
              }}
            />
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                activeFolderId={activeFolderId}
                onSelectFolder={onSelectFolder}
                level={level + 1}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export const FolderTreeNav: React.FC<FolderTreeNavProps> = ({ onSelectFolder, activeFolderId, treeData, isLoading }) => {
  if (isLoading) {
    return <FolderTreeSkeleton count={8} />;
  }

  if (!treeData) {
    return null;
  }

  return (
    <Box role="tree" aria-label="Folders" sx={{ w: '100%', h: '100%', overflowY: 'auto' }}>
      {treeData.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          activeFolderId={activeFolderId}
          onSelectFolder={onSelectFolder}
          level={0}
        />
      ))}
    </Box>
  );
};

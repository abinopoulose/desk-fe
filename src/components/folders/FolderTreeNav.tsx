import React, { useEffect, useState } from 'react';
import type { FolderNodeDTO } from '../../types/folder';

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
        return n.children?.some(c => hasActiveChild(c)) || false;
      };
      if (node.children?.some(c => hasActiveChild(c))) {
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
    <div className="w-full">
      <div 
        className={`flex items-center py-[5px] pr-2 cursor-pointer text-sm mb-[1px] group ${isActive ? 'bg-blue-50/80 text-blue-700' : 'text-gray-600 hover:bg-gray-100/80'} rounded-md transition-colors`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        <div 
          className={`w-5 h-5 mr-0.5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors ${hasChildren ? 'cursor-pointer' : 'opacity-0'}`} 
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren && (
            <svg 
              className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
        <svg 
          className={`w-4 h-4 mr-2.5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
        </svg>
        <span className="truncate flex-1 font-medium">{node.name}</span>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="flex flex-col w-full relative">
          <div 
            className="absolute left-0 top-0 bottom-0 border-l border-gray-200" 
            style={{ marginLeft: `${level * 16 + 18}px` }}
          ></div>
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              activeFolderId={activeFolderId} 
              onSelectFolder={onSelectFolder}
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTreeNav: React.FC<FolderTreeNavProps> = ({ onSelectFolder, activeFolderId, treeData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-pulse flex space-x-2 items-center">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!treeData) {
    return null;
  }

  return (
    <div className="w-full h-full overflow-y-auto px-1 py-2" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif' }}>
      {treeData.map(node => (
        <TreeNode 
          key={node.id} 
          node={node} 
          activeFolderId={activeFolderId} 
          onSelectFolder={onSelectFolder}
          level={0} 
        />
      ))}
    </div>
  );
};

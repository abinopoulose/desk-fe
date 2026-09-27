import React, { useEffect, useState } from 'react';
import { folderApi } from '../../api/folderApi';
import { FolderNodeDTO } from '../../types/folder';
import { useSearchParams } from 'react-router';

interface FolderTreeNavProps {
  onSelectFolder: (folderId: string) => void;
  activeFolderId: string | null;
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

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelectFolder(node.id);
  };

  return (
    <div className="w-full">
      <div 
        className={`flex items-center py-1.5 px-2 cursor-pointer hover:bg-gray-100 ${isActive ? 'bg-blue-100 text-blue-700 font-medium rounded' : 'text-gray-700'}`}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
        onClick={handleSelect}
      >
        <span 
          className={`mr-1.5 text-sm w-4 flex justify-center ${hasChildren ? 'cursor-pointer hover:text-gray-900' : 'opacity-0'}`} 
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren ? (isExpanded ? '▼' : '▶') : ''}
        </span>
        <span className="mr-2 text-lg">
          {isExpanded ? '📂' : '📁'}
        </span>
        <span className="truncate flex-1 text-sm">{node.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div className="flex flex-col w-full">
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

export const FolderTreeNav: React.FC<FolderTreeNavProps> = ({ onSelectFolder, activeFolderId }) => {
  const [treeData, setTreeData] = useState<FolderNodeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setIsLoading(true);
        const data = await folderApi.getFolderTree();
        setTreeData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load folder tree');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTree();
  }, []);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading folders...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="w-full h-full overflow-y-auto">
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

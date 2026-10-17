import React, { useState } from 'react';
import type { OrgNode } from '../../types/user';
import { getUserSlug } from '../../utils/userUtils';

export interface OrgChartTreeProps {
  data: OrgNode[];
  filterText?: string;
  onSelectUser?: (userId: string) => void;
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const matchesFilter = (node: OrgNode, filterText: string): boolean => {
  if (!filterText) return false;
  const text = filterText.toLowerCase();
  return (
    node.fullName.toLowerCase().includes(text) ||
    (node.title?.toLowerCase().includes(text) ?? false) ||
    (node.displayId?.toLowerCase().includes(text) ?? false)
  );
};

const hasMatchingChild = (node: OrgNode, filterText: string): boolean => {
  if (!filterText) return false;
  if (matchesFilter(node, filterText)) return true;
  if (node.children) {
    return node.children.some(child => hasMatchingChild(child, filterText));
  }
  return false;
};

const TreeNode = React.memo(({
  node,
  filterText,
  level,
  onSelectUser
}: {
  node: OrgNode;
  filterText: string;
  level: number;
  onSelectUser?: (userId: string) => void;
}) => {
  const forceExpand = filterText ? hasMatchingChild(node, filterText) : false;
  const [isExpanded, setIsExpanded] = useState(level < 2);
  
  const expanded = forceExpand || isExpanded;
  const matched = filterText ? matchesFilter(node, filterText) : false;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Node Card */}
        <div 
          onClick={() => onSelectUser?.(getUserSlug(node))}
          data-no-pan="true"
          className={`relative z-10 flex flex-col items-center justify-center p-4 w-52 border rounded-xl bg-white cursor-pointer shadow-xs hover:shadow-md transition-all ${
            matched
              ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/40'
              : 'border-slate-200/90 hover:border-indigo-300'
          }`}
          data-testid={`node-${node.id}`}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/70 flex items-center justify-center text-indigo-700 font-bold mb-2 shadow-2xs">
            {getInitials(node.fullName)}
          </div>
          <div className="font-semibold text-slate-900 text-center text-sm truncate w-full">{node.fullName}</div>
          {node.displayId && (
            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 mt-1">
              {node.displayId}
            </span>
          )}
          {node.title && <div className="text-xs text-slate-500 text-center mt-1 truncate w-full">{node.title}</div>}
          {hasChildren && (
            <div className="mt-2 text-2xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/60">
              {node.children!.length} reportees
            </div>
          )}
        </div>

        {hasChildren && (
          <button
            type="button"
            data-no-pan="true"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 focus:outline-none transition-colors"
            title={expanded ? "Collapse" : "Expand"}
            data-testid={`toggle-${node.id}`}
          >
            {expanded ? '−' : '+'}
          </button>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="relative flex pt-8">
          {/* Vertical line from parent down to the horizontal connector */}
          <div className="absolute top-0 left-1/2 w-px h-8 bg-slate-300 -translate-x-1/2"></div>
          
          {node.children!.map((child, index) => {
            const isFirst = index === 0;
            const isLast = index === node.children!.length - 1;
            const isOnly = node.children!.length === 1;

            return (
              <div key={child.id} className="relative flex flex-col items-center px-2">
                {/* Horizontal line */}
                {!isOnly && (
                  <div 
                    className={`absolute top-0 h-px bg-slate-300 ${
                      isFirst ? 'left-1/2 right-0' : 
                      isLast ? 'left-0 right-1/2' : 
                      'left-0 right-0'
                    }`}
                  ></div>
                )}
                {/* Vertical line from horizontal connector down to child */}
                <div className="w-px h-8 bg-slate-300"></div>
                
                <TreeNode
                  node={child}
                  filterText={filterText}
                  level={level + 1}
                  onSelectUser={onSelectUser}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export const OrgChartTree: React.FC<OrgChartTreeProps> = ({ data, filterText = '', onSelectUser }) => {
  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500">No hierarchy data available</div>;
  }

  return (
    <div className="inline-flex min-w-full justify-center p-8">
      <div className="flex gap-8">
        {data.map((rootNode) => (
          <TreeNode
            key={rootNode.id}
            node={rootNode}
            filterText={filterText}
            level={0}
            onSelectUser={onSelectUser}
          />
        ))}
      </div>
    </div>
  );
};

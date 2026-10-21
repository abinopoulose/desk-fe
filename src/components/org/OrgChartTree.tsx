import React, { useState, useEffect } from 'react';
import {
  Building,
  Mail,
  Users,
  Pencil,
  User as UserIcon,
} from 'lucide-react';
import type { OrgNode } from '../../types/user';

export interface OrgChartTreeProps {
  data: OrgNode[];
  filterText?: string;
  departmentFilter?: string;
  onSelectUser?: (userId: string) => void;
  onEditUser?: (node: OrgNode) => void;
  onViewProfile?: (userId: string) => void;
  expandAllSignal?: number;
  collapseAllSignal?: number;
}

const getInitials = (name: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const matchesFilter = (node: OrgNode, filterText: string, departmentFilter?: string): boolean => {
  if (departmentFilter && departmentFilter !== 'ALL') {
    if (node.departmentName !== departmentFilter) {
      return false;
    }
  }

  if (!filterText) return true;
  const text = filterText.toLowerCase();
  return (
    node.fullName.toLowerCase().includes(text) ||
    (node.title?.toLowerCase().includes(text) ?? false) ||
    (node.displayId?.toLowerCase().includes(text) ?? false) ||
    (node.email?.toLowerCase().includes(text) ?? false) ||
    (node.departmentName?.toLowerCase().includes(text) ?? false)
  );
};

const hasMatchingChild = (node: OrgNode, filterText: string, departmentFilter?: string): boolean => {
  if (!filterText && (!departmentFilter || departmentFilter === 'ALL')) return false;
  if (matchesFilter(node, filterText, departmentFilter)) return true;
  if (node.children) {
    return node.children.some((child) => hasMatchingChild(child, filterText, departmentFilter));
  }
  return false;
};

const TreeNode = React.memo(({
  node,
  filterText = '',
  departmentFilter = 'ALL',
  level,
  onSelectUser,
  onEditUser,
  onViewProfile,
  expandAllSignal,
  collapseAllSignal,
}: {
  node: OrgNode;
  filterText?: string;
  departmentFilter?: string;
  level: number;
  onSelectUser?: (userId: string) => void;
  onEditUser?: (node: OrgNode) => void;
  onViewProfile?: (userId: string) => void;
  expandAllSignal?: number;
  collapseAllSignal?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(level < 2);
  const [imgError, setImgError] = useState<boolean>(false);

  // Handle expand/collapse all signals
  useEffect(() => {
    if (expandAllSignal && expandAllSignal > 0) {
      setIsExpanded(true);
    }
  }, [expandAllSignal]);

  useEffect(() => {
    if (collapseAllSignal && collapseAllSignal > 0) {
      setIsExpanded(level < 1);
    }
  }, [collapseAllSignal, level]);

  const forceExpand = (filterText || (departmentFilter && departmentFilter !== 'ALL'))
    ? hasMatchingChild(node, filterText, departmentFilter)
    : false;

  const expanded = forceExpand || isExpanded;
  const matched = filterText ? matchesFilter(node, filterText, departmentFilter) : false;
  const hasChildren = Boolean(node.children && node.children.length > 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Node Card - Teams Style */}
        <div
          data-no-pan="true"
          onClick={() => {
            if (onViewProfile) {
              onViewProfile(node.id);
            } else if (onSelectUser) {
              onSelectUser(node.id);
            }
          }}
          className={`relative z-10 flex flex-col justify-between p-4 w-68 sm:w-72 border rounded-2xl bg-white cursor-pointer shadow-2xs hover:shadow-md transition-all duration-200 group text-left ${
            matched
              ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/40'
              : 'border-slate-200/90 hover:border-indigo-300'
          }`}
          data-testid={`node-${node.id}`}
        >
          {/* Header Identity (Avatar + Name + Title) */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full shrink-0 overflow-hidden border border-slate-200/80 shadow-2xs flex items-center justify-center font-bold text-xs bg-gradient-to-br from-indigo-500 to-indigo-700 text-white select-none">
              {node.profilePictureUrl && !imgError ? (
                <img
                  src={node.profilePictureUrl}
                  alt={node.fullName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(node.fullName)}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 text-sm truncate leading-snug group-hover:text-indigo-600 transition-colors">
                  {node.fullName}
                </span>
                {node.displayId && (
                  <span className="font-mono text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200/80">
                    {node.displayId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {node.title || 'Staff Member'}
              </p>
            </div>
          </div>

          {/* Department & Email info */}
          <div className="mt-3 pt-2.5 border-t border-slate-100/90 flex flex-col gap-1.5">
            {node.departmentName && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Building className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="text-[11px] font-medium text-slate-700 truncate">
                  {node.departmentName}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500 font-mono truncate">
                {node.email}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              data-no-pan="true"
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile?.(node.id);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
            >
              <UserIcon className="w-3 h-3" />
              <span>Profile</span>
            </button>

            {onEditUser && (
              <button
                type="button"
                data-no-pan="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditUser(node);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Expand / Collapse Badge on stem */}
        {hasChildren && (
          <div className="relative flex flex-col items-center">
            <div className="w-px h-5 bg-slate-300" />
            <button
              type="button"
              data-no-pan="true"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!expanded);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 rounded-full text-[10px] font-bold text-slate-700 hover:text-indigo-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer z-20"
              title={expanded ? "Collapse direct reports" : "Expand direct reports"}
              data-testid={`toggle-${node.id}`}
            >
              <Users className="w-2.5 h-2.5 text-indigo-500" />
              <span>
                {node.children!.length} {node.children!.length === 1 ? 'report' : 'reports'}
              </span>
              <span className="text-slate-400 text-[9px] font-bold">
                {expanded ? '▲' : '▼'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Children branches */}
      {expanded && hasChildren && (
        <div className="relative flex pt-5">
          {/* Vertical line from toggle down to horizontal junction */}
          <div className="absolute top-0 left-1/2 w-px h-5 bg-slate-300 -translate-x-1/2" />

          {node.children!.map((child, index) => {
            const isFirst = index === 0;
            const isLast = index === node.children!.length - 1;
            const isOnly = node.children!.length === 1;

            return (
              <div key={child.id} className="relative flex flex-col items-center px-3">
                {/* Horizontal rail connecting siblings */}
                {!isOnly && (
                  <div
                    className={`absolute top-0 h-px bg-slate-300 ${
                      isFirst
                        ? 'left-1/2 right-0'
                        : isLast
                        ? 'left-0 right-1/2'
                        : 'left-0 right-0'
                    }`}
                  />
                )}
                {/* Vertical line down to child node card */}
                <div className="w-px h-5 bg-slate-300" />

                <TreeNode
                  node={child}
                  filterText={filterText}
                  departmentFilter={departmentFilter}
                  level={level + 1}
                  onSelectUser={onSelectUser}
                  onEditUser={onEditUser}
                  onViewProfile={onViewProfile}
                  expandAllSignal={expandAllSignal}
                  collapseAllSignal={collapseAllSignal}
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

export const OrgChartTree: React.FC<OrgChartTreeProps> = ({
  data,
  filterText = '',
  departmentFilter = 'ALL',
  onSelectUser,
  onEditUser,
  onViewProfile,
  expandAllSignal,
  collapseAllSignal,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Users className="w-10 h-10 text-slate-300 mb-3" />
        <span className="text-sm font-medium">No organizational hierarchy data available</span>
        <p className="text-xs text-slate-400 mt-1">Assign managers to employees to build your reporting hierarchy</p>
      </div>
    );
  }

  return (
    <div className="inline-flex min-w-full justify-center p-8 sm:p-12">
      <div className="flex gap-10">
        {data.map((rootNode) => (
          <TreeNode
            key={rootNode.id}
            node={rootNode}
            filterText={filterText}
            departmentFilter={departmentFilter}
            level={0}
            onSelectUser={onSelectUser}
            onEditUser={onEditUser}
            onViewProfile={onViewProfile}
            expandAllSignal={expandAllSignal}
            collapseAllSignal={collapseAllSignal}
          />
        ))}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  FolderTree,
  FolderClosed,
  AlertCircle,
  X,
  Users,
} from 'lucide-react';
import { OrgChartTree } from './OrgChartTree';
import { OrgChartSkeleton } from '../common/Skeletons';
import { UserProfileModal } from '../user/UserProfileModal';
import { useOrgChart } from '../../hooks/useOrgChart';
import type { OrgNode, User } from '../../types/user';

export interface OrgChartViewProps {
  onEditEmployee?: (user: User) => void;
  usersList?: User[];
}

export const OrgChartView: React.FC<OrgChartViewProps> = ({
  onEditEmployee,
  usersList = [],
}) => {
  const { orgData, loading, error, refetch } = useOrgChart();
  const [filterText, setFilterText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [expandAllSignal, setExpandAllSignal] = useState(0);
  const [collapseAllSignal, setCollapseAllSignal] = useState(0);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.1).toFixed(1)), 2));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.1).toFixed(1)), 0.4));
  const handleZoomReset = () => setZoom(1);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-pan], button, a, input, select')) return;
    if (!canvasRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: canvasRef.current.scrollLeft,
      scrollTop: canvasRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !canvasRef.current) return;
    e.preventDefault();
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    canvasRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    canvasRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => setIsPanning(false);

  // Extract all unique departments from orgData
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    const walk = (nodes: OrgNode[]) => {
      for (const node of nodes) {
        if (node.departmentName) depts.add(node.departmentName);
        if (node.children) walk(node.children);
      }
    };
    walk(orgData);
    return Array.from(depts).sort();
  }, [orgData]);

  // Count total employees in tree
  const totalEmployeesInTree = useMemo(() => {
    let count = 0;
    const walk = (nodes: OrgNode[]) => {
      count += nodes.length;
      for (const node of nodes) {
        if (node.children) walk(node.children);
      }
    };
    walk(orgData);
    return count;
  }, [orgData]);

  // Handle Edit Action from Tree node
  const handleEditNode = (node: OrgNode) => {
    if (!onEditEmployee) return;
    // Find matching user from usersList if available
    const existingUser = usersList.find((u) => u.id === node.id);
    if (existingUser) {
      onEditEmployee(existingUser);
    } else {
      // Synthesize user object from OrgNode
      onEditEmployee({
        id: node.id,
        fullName: node.fullName,
        email: node.email,
        title: node.title,
        status: 'ACTIVE',
        roles: ['EMPLOYEE'],
        displayId: node.displayId,
        departmentId: node.departmentId ?? undefined,
        departmentName: node.departmentName ?? undefined,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col flex-1 h-full min-h-[580px] w-full bg-slate-50 text-slate-800 rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
    >
      {/* Controls Toolbar */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 shadow-2xs flex-none z-10 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Search & Department Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xs min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tree by name, role, email..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400 transition-colors"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          {availableDepartments.length > 0 && (
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Total Tree Size Pill */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl text-2xs font-semibold text-slate-600">
            <Users className="w-3 h-3 text-indigo-600" />
            <span>{totalEmployeesInTree} staff in tree</span>
          </div>
        </div>

        {/* Right: Expand/Collapse & Zoom & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          {/* Expand / Collapse All */}
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setExpandAllSignal((s) => s + 1)}
              className="inline-flex items-center gap-1 px-2 py-1 text-2xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Expand all tree branches"
            >
              <FolderTree className="w-3 h-3" />
              <span className="hidden sm:inline">Expand All</span>
            </button>
            <div className="h-3 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => setCollapseAllSignal((s) => s + 1)}
              className="inline-flex items-center gap-1 px-2 py-1 text-2xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Collapse branches to top managers"
            >
              <FolderClosed className="w-3 h-3" />
              <span className="hidden sm:inline">Collapse</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold text-slate-700 w-11 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={handleZoomReset}
              className="inline-flex items-center gap-1 px-2 py-1 text-2xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Reset zoom to 100%"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Pan / Zoom Canvas */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 min-h-[500px] overflow-auto relative p-6 sm:p-10 w-full select-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {loading ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <OrgChartSkeleton />
          </div>
        ) : error ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 py-20">
            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              type="button"
              onClick={refetch}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Retry Loading Hierarchy
            </button>
          </div>
        ) : (
          <div
            className="min-w-full min-h-full transition-transform origin-top flex justify-center items-start pb-20"
            style={{ transform: `scale(${zoom})` }}
          >
            <OrgChartTree
              data={orgData}
              filterText={filterText}
              departmentFilter={departmentFilter}
              onSelectUser={(userId) => setSelectedProfileUserId(userId)}
              onViewProfile={(userId) => setSelectedProfileUserId(userId)}
              onEditUser={onEditEmployee ? handleEditNode : undefined}
              expandAllSignal={expandAllSignal}
              collapseAllSignal={collapseAllSignal}
            />
          </div>
        )}
      </div>

      {/* Teams-style User Profile Modal */}
      {selectedProfileUserId && (
        <UserProfileModal
          userId={selectedProfileUserId}
          isOpen={Boolean(selectedProfileUserId)}
          onClose={() => setSelectedProfileUserId(null)}
        />
      )}
    </div>
  );
};

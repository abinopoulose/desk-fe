import { OrgChartSkeleton } from "../../components/common/Skeletons";
import { ROUTES } from '../../constants';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { OrgChartTree } from '../../components/org/OrgChartTree';
import { useOrgChart } from '../../hooks/useOrgChart';
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertCircle,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

export const OrgChartPage: React.FC = () => {
  const { orgData: data, loading, error, refetch: fetchHierarchy } = useOrgChart();
  const [filterText, setFilterText] = useState('');
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const navigate = useNavigate();

  const handleSelectUser = useCallback((userId: string) => {
    navigate(ROUTES.USERS.PROFILE(userId));
  }, [navigate]);

  const handleZoomIn = () => setZoom(z => Math.min(Number((z + 0.1).toFixed(1)), 2));
  const handleZoomOut = () => setZoom(z => Math.max(Number((z - 0.1).toFixed(1)), 0.4));
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
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-pan], button, a, input')) return;
    if (!canvasRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: canvasRef.current.scrollLeft,
      scrollTop: canvasRef.current.scrollTop
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

  return (
    <div
      ref={containerRef}
      className="flex flex-col flex-1 h-full min-h-[calc(100vh-4rem)] w-full bg-slate-50 text-slate-800 overflow-hidden"
    >
      {/* Controls Toolbar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-10 py-3 shadow-2xs flex-none z-10">
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          {/* Controls: Search + Zoom + Fullscreen */}
            <div className="relative flex-grow md:flex-grow-0 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or title..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400 text-slate-800 transition-colors"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-slate-700 w-12 text-center select-none">
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
                title="Reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title={isFullscreen ? "Exit full screen" : "Full screen"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

      {/* Main Canvas - uses full screen height, pan/zoom enabled */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 min-h-0 overflow-auto relative p-6 lg:p-10 w-full select-none ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {loading ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <OrgChartSkeleton />
          </div>
        ) : error ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 py-20">
            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchHierarchy}
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
              data={data}
              filterText={filterText}
              onSelectUser={handleSelectUser}
            />
          </div>
        )}
      </div>
    </div>
  );
};

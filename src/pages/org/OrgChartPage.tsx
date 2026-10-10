import { OrgChartSkeleton } from "../../components/common/Skeletons";
import { ROUTES } from '../../constants';
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { OrgChartTree } from '../../components/org/OrgChartTree';
import { useOrgChart } from '../../hooks/useOrgChart';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export const OrgChartPage: React.FC = () => {
  const { orgData: data, loading, error, refetch: fetchHierarchy } = useOrgChart();
  const [filterText, setFilterText] = useState('');
  const [zoom, setZoom] = useState(1);
  const navigate = useNavigate();

  const handleSelectUser = useCallback((userId: string) => {
    navigate(ROUTES.USERS.PROFILE(userId));
  }, [navigate]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 text-slate-800">
      {/* Top Header Card */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-5 lg:px-10 shadow-2xs flex-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Network className="w-3.5 h-3.5" />
                Company Directory
              </span>
              <span className="text-xs text-slate-400 font-medium">Reporting Structure</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organization Chart</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive visualization of employee reporting lines and department hierarchies.
            </p>
          </div>

          {/* Controls: Search + Zoom */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or title..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400 text-slate-800"
              />
            </div>

            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
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
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
              <button
                type="button"
                onClick={handleZoomReset}
                className="inline-flex items-center gap-1 px-2 py-1 text-2xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                title="Reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-grow overflow-auto relative p-6 lg:p-10">
        {loading ? (
          <div className="w-full h-full max-w-5xl mx-auto">
            <OrgChartSkeleton />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchHierarchy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Retry Loading Hierarchy
            </button>
          </div>
        ) : (
          <div
            className="min-w-full min-h-full transition-transform origin-top flex justify-center"
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

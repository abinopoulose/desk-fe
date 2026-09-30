import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { OrgChartTree } from '../../components/org/OrgChartTree';
import { useOrgChart } from '../../hooks/useOrgChart';

export const OrgChartPage: React.FC = () => {
  const { orgData: data, loading, error, refetch: fetchHierarchy } = useOrgChart();
  const [filterText, setFilterText] = useState('');
  const [zoom, setZoom] = useState(1);
  const navigate = useNavigate();

  const handleSelectUser = useCallback((userId: string) => {
    navigate(`/users/${userId}`);
  }, [navigate]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      <div className="flex-none p-4 bg-white border-b border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-800">Organization Chart</h1>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name or title..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow sm:flex-grow-0"
          />
          
          <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1">
            <button onClick={handleZoomOut} className="px-2 py-1 bg-white rounded shadow-sm text-sm hover:bg-gray-50">-</button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="px-2 py-1 bg-white rounded shadow-sm text-sm hover:bg-gray-50">+</button>
            <button onClick={handleZoomReset} className="px-2 py-1 bg-white rounded shadow-sm text-sm hover:bg-gray-50">Reset</button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-auto relative">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" data-testid="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="text-red-500 font-medium">{error}</div>
            <button 
              onClick={fetchHierarchy}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div 
            className="min-w-full min-h-full transition-transform origin-top"
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

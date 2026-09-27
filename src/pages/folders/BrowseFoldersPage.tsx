import React, { useState } from 'react';
import { useSearchParams } from 'react-router';
import { FolderTreeNav } from '../../components/folders/FolderTreeNav';
import { FolderContents } from '../../components/folders/FolderContents';

export const BrowseFoldersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folderId');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSelectFolder = (id: string) => {
    setSearchParams({ folderId: id });
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden relative">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        w-72 bg-gray-50 border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Folders</h2>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="p-2 h-[calc(100%-3.5rem)] overflow-y-auto">
          <FolderTreeNav 
            activeFolderId={folderId} 
            onSelectFolder={handleSelectFolder} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden p-4 border-b border-gray-200 bg-white flex items-center">
          <button 
            onClick={toggleSidebar}
            className="mr-3 text-gray-600 hover:text-gray-900"
          >
            ☰
          </button>
          <h1 className="font-semibold">Browse</h1>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {folderId ? (
            <FolderContents 
              folderId={folderId} 
              onSelectFolder={handleSelectFolder} 
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a folder from the sidebar to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

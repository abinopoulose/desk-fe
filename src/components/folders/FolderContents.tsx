import React from 'react';
import { useNavigate } from 'react-router';
import type { FolderContentsDTO } from '../../types/folder';
import { useAuth } from '../../store/authStore';
import { ROUTES } from '../../constants';

interface FolderContentsProps {
  folderId: string;
  onSelectFolder: (folderId: string) => void;
  contents: FolderContentsDTO | null;
  isLoading: boolean;
  error: string | null;
}

export const FolderContents: React.FC<FolderContentsProps> = ({ 
  folderId, 
  onSelectFolder,
  contents,
  isLoading,
  error
}) => {
  const navigate = useNavigate();
  const { hasPrivilege } = useAuth();

  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading contents...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!contents) {
    return <div className="p-6 text-gray-500">Select a folder to view its contents</div>;
  }

  const breadcrumbPath = contents.ticketTypes.length > 0 
    ? contents.ticketTypes[0].folderPath 
    : contents.folderName;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {breadcrumbPath.split('/').map((part, index, arr) => (
            <React.Fragment key={index}>
              <span>{part}</span>
              {index < arr.length - 1 && <span className="mx-2 text-gray-400">&gt;</span>}
            </React.Fragment>
          ))}
        </h2>
        {hasPrivilege('TICKET_TYPE_WRITE') && (
          <button
            onClick={() => navigate(`${ROUTES.ADMIN.TICKET_TYPE_NEW}?folderId=${folderId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Add Ticket Type
          </button>
        )}
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {contents.subfolders.length === 0 && contents.ticketTypes.length === 0 && (
          <div className="text-gray-500 text-center py-8">
            <p className="mb-4">This folder is empty</p>
            {hasPrivilege('TICKET_TYPE_WRITE') && (
              <button
                onClick={() => navigate(`${ROUTES.ADMIN.TICKET_TYPE_NEW}?folderId=${folderId}`)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                + Add Ticket Type
              </button>
            )}
          </div>
        )}

        {contents.subfolders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Folders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {contents.subfolders.map(sub => (
                <div 
                  key={sub.id}
                  onClick={() => onSelectFolder(sub.id)}
                  className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl mr-3">📁</span>
                  <span className="font-medium text-gray-700 truncate">{sub.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {contents.ticketTypes.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Ticket Types</h3>
              {hasPrivilege('TICKET_TYPE_WRITE') && (
                <button
                  onClick={() => navigate(`${ROUTES.ADMIN.TICKET_TYPE_NEW}?folderId=${folderId}`)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Ticket Type
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contents.ticketTypes.map(type => (
                <div 
                  key={type.id}
                  onClick={() => navigate(`/tickets/new?typeId=${type.id}`)}
                  className="flex flex-col p-5 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800">{type.title}</h4>
                    <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {type.departmentName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 flex-1">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

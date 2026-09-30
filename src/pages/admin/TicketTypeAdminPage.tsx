import { ROUTES } from '../../constants';
import React from 'react';
import { useNavigate } from 'react-router';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { useTicketTypes } from '../../hooks';

export const TicketTypeAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    filteredTypes,
    loading,
    error,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    handleToggleActive,
    deleteConfirmId,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useTicketTypes({ autoFetch: true, includeInactive: true });

  return (
    <PrivilegeGate requiredPrivilege="TICKET_TYPE_WRITE">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Ticket Types Management</h1>
          <button
            onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPE_NEW)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Create New Type
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="border p-2 rounded"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-medium text-gray-600">Title</th>
                  <th className="p-4 font-medium text-gray-600">Department</th>
                  <th className="p-4 font-medium text-gray-600">Folder Path</th>
                  <th className="p-4 font-medium text-gray-600">Status</th>
                  <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map((type) => (
                  <tr key={type.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{type.title}</td>
                    <td className="p-4 text-gray-600">{type.departmentId}</td>
                    <td className="p-4 text-gray-600 text-sm font-mono">{type.folderPath || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${type.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {type.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/admin/ticket-types/${type.id}/statuses`)}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      >
                        Statuses
                      </button>
                      <button
                        onClick={() => navigate(`/admin/ticket-types/${type.id}/edit`)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit Schema
                      </button>
                      <button
                        onClick={(e) => handleToggleActive(type.id, type.isActive, e)}
                        className={`px-3 py-1 text-sm rounded ${type.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      >
                        {type.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => requestDelete(type.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTypes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No ticket types found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this ticket type? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrivilegeGate>
  );
};

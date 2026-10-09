import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DataGridSkeleton } from "../../components/common/Skeletons";
import { ROUTES } from '../../constants';
import React from 'react';
import { useNavigate } from 'react-router';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { useTicketStatuses } from '../../hooks';

export const TicketStatusManager: React.FC = () => {
  const navigate = useNavigate();
  const {
    ticketType,
    statuses,
    loading,
    error,
    formState,
    setFormField,
    isModalOpen,
    editingStatus,
    startEdit,
    cancelEdit,
    save,
    remove,
    handleMove,
  } = useTicketStatuses();

  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteClick = (id: string) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await remove(confirmDelete, true);
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  if (loading) return <div className="p-6"><DataGridSkeleton rows={5} columns={4} /></div>;

  return (
    <PrivilegeGate requiredPrivilege="TICKET_TYPE_WRITE">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manage Statuses</h1>
            <p className="text-gray-600">for {ticketType?.title}</p>
          </div>
          <button
            onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPES)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to List
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Status Workflow</h2>
            <button
              onClick={() => startEdit()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              + Add Status
            </button>
          </div>

          <div className="space-y-3">
            {statuses.map((status, index) => (
              <div key={status.id} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                <div>
                  <span className="font-bold">{status.name}</span>
                  <span className={`ml-3 px-2 py-1 text-xs rounded font-bold ${
                    status.mappedState === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {status.mappedState}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 px-2 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === statuses.length - 1}
                    className="p-1 px-2 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => startEdit(status)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm mx-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(status.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {statuses.length === 0 && (
              <p className="text-center text-gray-500 py-4">No statuses defined yet.</p>
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">
                {editingStatus ? 'Edit Status' : 'Add Status'}
              </h3>
              <form onSubmit={save}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Status Name *</label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormField('name', e.target.value)}
                    className="w-full border rounded p-2"
                    placeholder="e.g. In Progress"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Mapped State</label>
                  <select
                    value={formState.mappedState}
                    onChange={(e) => setFormField('mappedState', e.target.value as 'OPEN' | 'CLOSED')}
                    className="w-full border rounded p-2"
                  >
                    <option value="OPEN">OPEN (Active Ticket)</option>
                    <option value="CLOSED">CLOSED (Resolved/Done)</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleConfirmDelete} title="Delete Status" description={<>Are you sure you want to delete this status? This action cannot be undone.</>} loading={isDeleting} />
    </PrivilegeGate>
  );
};

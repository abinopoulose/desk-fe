import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import { TicketStatusDTO, TicketTypeDTO } from '../../types/ticket';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';

export const TicketStatusManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const typeId = id as string;

  const [ticketType, setTicketType] = useState<TicketTypeDTO | null>(null);
  const [statuses, setStatuses] = useState<TicketStatusDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TicketStatusDTO | null>(null);
  const [statusName, setStatusName] = useState('');
  const [mappedState, setMappedState] = useState<'OPEN' | 'CLOSED'>('OPEN');

  const loadData = async () => {
    try {
      setLoading(true);
      const [typeData, statusesData] = await Promise.all([
        ticketTypeApi.getTicketTypeById(typeId),
        ticketTypeApi.getTicketStatuses(typeId)
      ]);
      setTicketType(typeData);
      
      // Sort by display order
      const sorted = [...statusesData].sort((a, b) => a.displayOrder - b.displayOrder);
      setStatuses(sorted);
    } catch (err) {
      console.error('Error loading data', err);
      setError('Failed to load statuses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  const openModal = (status?: TicketStatusDTO) => {
    if (status) {
      setEditingStatus(status);
      setStatusName(status.name);
      setMappedState(status.mappedState);
    } else {
      setEditingStatus(null);
      setStatusName('');
      setMappedState('OPEN');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStatus(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStatus) {
        await ticketTypeApi.updateTicketStatus(editingStatus.id, {
          name: statusName,
          mappedState,
          displayOrder: editingStatus.displayOrder
        });
      } else {
        await ticketTypeApi.createTicketStatus(typeId, {
          name: statusName,
          mappedState,
          displayOrder: statuses.length
        });
      }
      closeModal();
      loadData();
    } catch (err) {
      console.error('Failed to save status', err);
      setError('Failed to save status.');
    }
  };

  const handleDelete = async (statusId: string) => {
    if (!window.confirm('Are you sure you want to delete this status?')) return;
    try {
      await ticketTypeApi.deleteTicketStatus(statusId);
      loadData();
    } catch (err) {
      console.error('Failed to delete status', err);
      setError('Failed to delete status.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === statuses.length - 1) return;

    const newStatuses = [...statuses];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap locally
    [newStatuses[index], newStatuses[swapIndex]] = [newStatuses[swapIndex], newStatuses[index]];
    
    // Update display orders
    newStatuses[index].displayOrder = index;
    newStatuses[swapIndex].displayOrder = swapIndex;
    setStatuses(newStatuses);

    // Save to backend
    try {
      await Promise.all([
        ticketTypeApi.updateTicketStatus(newStatuses[index].id, {
          name: newStatuses[index].name,
          mappedState: newStatuses[index].mappedState,
          displayOrder: newStatuses[index].displayOrder
        }),
        ticketTypeApi.updateTicketStatus(newStatuses[swapIndex].id, {
          name: newStatuses[swapIndex].name,
          mappedState: newStatuses[swapIndex].mappedState,
          displayOrder: newStatuses[swapIndex].displayOrder
        })
      ]);
    } catch (err) {
      console.error('Failed to update orders', err);
      setError('Failed to update orders.');
      loadData(); // Revert on failure
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <PrivilegeGate requiredPrivilege="TICKET_TYPE_WRITE">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manage Statuses</h1>
            <p className="text-gray-600">for {ticketType?.title}</p>
          </div>
          <button
            onClick={() => navigate('/admin/ticket-types')}
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
              onClick={() => openModal()}
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
                    onClick={() => openModal(status)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm mx-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(status.id)}
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
              <form onSubmit={handleSave}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Status Name *</label>
                  <input
                    type="text"
                    required
                    value={statusName}
                    onChange={(e) => setStatusName(e.target.value)}
                    className="w-full border rounded p-2"
                    placeholder="e.g. In Progress"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Mapped State</label>
                  <select
                    value={mappedState}
                    onChange={(e) => setMappedState(e.target.value as 'OPEN' | 'CLOSED')}
                    className="w-full border rounded p-2"
                  >
                    <option value="OPEN">OPEN (Active Ticket)</option>
                    <option value="CLOSED">CLOSED (Resolved/Done)</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
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
    </PrivilegeGate>
  );
};

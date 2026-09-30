import React from 'react';
import { Link } from 'react-router';
import { DEFAULT_CLOSED_STATUS_ID, DEFAULT_CLOSED_STATUS_NAME } from '../../constants';

export interface TicketManagementCardProps {
  currentStatus: { id: string; name: string; mappedState: 'OPEN' | 'CLOSED' };
  assignee?: { id: string; fullName: string; email: string };
  canManage: boolean;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAssigneeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const TicketManagementCard: React.FC<TicketManagementCardProps> = ({
  currentStatus,
  assignee,
  canManage,
  onStatusChange,
  onAssigneeChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Management</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        {canManage ? (
          <select
            className="w-full border rounded p-2"
            value={currentStatus.id}
            onChange={onStatusChange}
          >
            <option value={currentStatus.id}>{currentStatus.name}</option>
            {currentStatus.id !== DEFAULT_CLOSED_STATUS_ID && (
              <option value={DEFAULT_CLOSED_STATUS_ID}>{DEFAULT_CLOSED_STATUS_NAME}</option>
            )}
          </select>
        ) : (
          <div className="p-2 bg-gray-50 rounded border text-sm">{currentStatus.name}</div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
        {canManage ? (
          <select
            className="w-full border rounded p-2"
            value={assignee?.id || ''}
            onChange={onAssigneeChange}
          >
            <option value="">Unassigned</option>
            <option value={assignee?.id || 'agent-1'}>{assignee?.fullName || 'Current Agent'}</option>
          </select>
        ) : (
          <div className="p-2 bg-gray-50 rounded border text-sm">
            {assignee ? (
              <Link to={`/users/${assignee.id}`} className="text-blue-600 hover:underline">
                {assignee.fullName}
              </Link>
            ) : (
              'Unassigned'
            )}
          </div>
        )}
      </div>
    </div>
  );
};

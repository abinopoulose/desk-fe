import React from 'react';
import { Link } from 'react-router';
import type { TicketDetailResponse } from '../../types/ticket';
import { getPriorityColor, getPriorityLabel } from '../../constants';
import { SLAIndicator } from './SLAIndicator';

export interface TicketHeaderProps {
  ticket: TicketDetailResponse;
  onCopyId?: () => void;
}

export const TicketHeader: React.FC<TicketHeaderProps> = ({ ticket, onCopyId }) => {
  const handleCopy = () => {
    if (onCopyId) {
      onCopyId();
    } else {
      navigator.clipboard.writeText(ticket.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">#{ticket.id.substring(0, 8)}</h1>
          <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Copy ID"
          >
            Copy
          </button>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
            {getPriorityLabel(ticket.priority)}
          </span>
        </div>
        <h2 className="text-xl text-gray-800">{ticket.ticketType.title}</h2>
        <div className="text-sm text-gray-500 mt-2">
          Opened on {new Date(ticket.createdAt).toLocaleDateString()} by{' '}
          <Link to={`/users/${ticket.requester.id}`} className="text-blue-600 hover:underline">
            {ticket.requester.fullName}
          </Link>
          <span className="mx-2">•</span>
          Updated {new Date(ticket.updatedAt).toLocaleString()}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        <SLAIndicator
          createdAt={ticket.createdAt}
          dueAt={ticket.slaDueAt}
          breached={ticket.slaBreached}
          statusState={ticket.currentStatus.mappedState}
        />
      </div>
    </div>
  );
};

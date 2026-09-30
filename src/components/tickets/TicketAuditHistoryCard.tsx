import React from 'react';
import type { TicketHistoryDTO } from '../../types/ticket';

export interface TicketAuditHistoryCardProps {
  history?: TicketHistoryDTO[];
}

export const TicketAuditHistoryCard: React.FC<TicketAuditHistoryCardProps> = ({ history = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <details>
        <summary className="text-lg font-semibold cursor-pointer outline-none">Audit History</summary>
        <div className="mt-4 space-y-3">
          {history.map((entry) => (
            <div key={entry.id} className="text-sm pb-3 border-b last:border-0 last:pb-0">
              <span className="font-semibold">{entry.changedByUserName}</span> changed{' '}
              <span className="font-mono">{entry.fieldName}</span> from{' '}
              <span className="line-through text-gray-500">{entry.oldValue}</span> to{' '}
              <span className="text-green-600">{entry.newValue}</span>
              <div className="text-xs text-gray-400 mt-1">{new Date(entry.changedAt).toLocaleString()}</div>
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-gray-500">No history available.</p>}
        </div>
      </details>
    </div>
  );
};

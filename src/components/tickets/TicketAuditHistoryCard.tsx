import React from 'react';
import { History, ChevronDown } from 'lucide-react';
import type { TicketHistoryDTO } from '../../types/ticket';

export interface TicketAuditHistoryCardProps {
  history?: TicketHistoryDTO[];
}

export const TicketAuditHistoryCard: React.FC<TicketAuditHistoryCardProps> = ({ history = [] }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer outline-none list-none select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Audit History</h3>
              <p className="text-xs text-slate-400">{history.length} lifecycle events recorded</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
        </summary>

        <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
          {history.map((entry) => (
            <div key={entry.id} className="text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">{entry.changedByUserName}</span>
                <span className="text-[11px] text-slate-400">
                  {new Date(entry.changedAt).toLocaleString()}
                </span>
              </div>
              <div className="text-slate-600">
                Updated <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">{entry.fieldName}</span> from{' '}
                <span className="line-through text-slate-400">{entry.oldValue || 'none'}</span> to{' '}
                <span className="font-semibold text-emerald-700">{entry.newValue || 'none'}</span>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">No historical changes recorded for this request.</p>
          )}
        </div>
      </details>
    </div>
  );
};

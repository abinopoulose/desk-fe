import React from 'react';
import { Link } from 'react-router';
import { Settings, CheckCircle2, User as UserIcon } from 'lucide-react';
import { DEFAULT_CLOSED_STATUS_ID, DEFAULT_CLOSED_STATUS_NAME, ROUTES } from '../../constants';
import { getUserSlug } from '../../utils/userUtils';

import { AssigneeSearchBar } from './AssigneeSearchBar';
import type { TicketStatusDTO } from '../../types/ticket';
import type { User } from '../../types/user';

export interface TicketManagementCardProps {
  currentStatus: { id: string; name: string; mappedState: 'OPEN' | 'CLOSED' };
  assignee?: { id: string; fullName: string; email: string; profilePictureUrl?: string; displayId?: string };
  availableStatuses?: TicketStatusDTO[];
  availableAssignees?: User[];
  canManage: boolean;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAssigneeChange: (assigneeIdOrEvent: string | null | React.ChangeEvent<HTMLSelectElement>) => void;
}

export const TicketManagementCard: React.FC<TicketManagementCardProps> = ({
  currentStatus,
  assignee,
  availableStatuses,
  availableAssignees,
  canManage,
  onStatusChange,
  onAssigneeChange,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Request Actions</h3>
          <p className="text-xs text-slate-400">Manage status and assignee</p>
        </div>
      </div>

      {/* Status control */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
          Status
        </label>
        {canManage ? (
          <select
            className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            value={currentStatus.id}
            onChange={onStatusChange}
          >
            {availableStatuses && availableStatuses.length > 0 ? (
              availableStatuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.mappedState})
                </option>
              ))
            ) : (
              <>
                <option value={currentStatus.id}>{currentStatus.name}</option>
                {currentStatus.id !== DEFAULT_CLOSED_STATUS_ID && (
                  <option value={DEFAULT_CLOSED_STATUS_ID}>{DEFAULT_CLOSED_STATUS_NAME}</option>
                )}
              </>
            )}
          </select>
        ) : (
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>{currentStatus.name}</span>
          </div>
        )}
      </div>

      {/* Assignee control */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
          Assignee
        </label>
        <AssigneeSearchBar
          assignee={assignee}
          availableAssignees={availableAssignees}
          canManage={canManage}
          onAssigneeChange={(assigneeId) => {
            if (typeof onAssigneeChange === 'function') {
              try {
                (onAssigneeChange as any)(assigneeId);
              } catch {
                (onAssigneeChange as any)({ target: { value: assigneeId ?? '' } });
              }
            }
          }}
        />
      </div>
    </div>
  );
};

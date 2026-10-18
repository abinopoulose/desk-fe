import React, { useState } from 'react';
import { Link } from 'react-router';
import { Copy, Check, Clock, CheckCircle2, User, Flame, Loader2 } from 'lucide-react';
import type { TicketDetailResponse } from '../../types/ticket';
import { SLAIndicator } from './SLAIndicator';
import { ROUTES } from '../../constants';
import { getUserSlug } from '../../utils/userUtils';
import { getPriorityStyle, getTicketDisplayReference } from '../../utils/ticketUtils';

export interface TicketHeaderProps {
  ticket: TicketDetailResponse;
  onCopyId?: () => void;
  canEscalate?: boolean;
  onEscalate?: () => void;
  escalating?: boolean;
}

export const TicketHeader: React.FC<TicketHeaderProps> = ({
  ticket,
  onCopyId,
  canEscalate,
  onEscalate,
  escalating,
}) => {
  const [copied, setCopied] = useState(false);
  const priorityCfg = getPriorityStyle(ticket.priority);
  const isOpen = ticket.currentStatus.mappedState === 'OPEN';
  const displayId = getTicketDisplayReference(ticket);

  const handleCopy = () => {
    if (onCopyId) {
      onCopyId();
    } else {
      navigator.clipboard.writeText(displayId);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-xs font-bold bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-700">
            {displayId}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            title="Copy Full Reference ID"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
            <span>{priorityCfg.label}</span>
          </span>

          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            isOpen
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {isOpen ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
            <span>{ticket.currentStatus.name}</span>
          </span>
          {ticket.escalated && (
            <span
              data-testid="escalated-tag"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs"
            >
              <Flame className="w-3 h-3 text-rose-600 fill-rose-500" />
              <span>Escalated</span>
            </span>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            {ticket.title || ticket.ticketType.title}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Request Type:</span>
            <span className="font-semibold text-slate-700">{ticket.ticketType.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <span>Opened on {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <Link to={ROUTES.USERS.PROFILE(getUserSlug(ticket.requester))} className="font-semibold text-slate-700 hover:text-indigo-600 hover:underline">
              {ticket.requester.fullName}
            </Link>
          </div>
          <span>•</span>
          <span>Updated {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="flex flex-col md:items-end gap-2">
        <SLAIndicator
          createdAt={ticket.createdAt}
          dueAt={ticket.slaDueAt}
          breached={ticket.slaBreached}
          statusState={ticket.currentStatus.mappedState}
        />
        {canEscalate && (
          <button
            type="button"
            onClick={onEscalate}
            disabled={escalating}
            data-testid="escalate-ticket-button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {escalating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Escalating...</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 fill-rose-200" />
                <span>Escalate</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

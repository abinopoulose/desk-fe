import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, ChevronRight, AlertCircle, Lock, CheckCircle2, Loader2, Send, Flame } from 'lucide-react';
import { PageHeaderSkeleton, CardSkeleton } from '../../components/common/Skeletons';
import { useTicketDetails, useTicketComments } from '../../hooks';
import { useAuth } from '../../store/authStore';
import { ROUTES } from '../../constants';
import { useBreadcrumbStore } from '../../store/breadcrumbStore';
import type { ApiError } from '../../utils/apiErrorHandler';
import { canUserEscalateTicket } from '../../utils/ticketUtils';
import {
  TicketHeader,
  TicketFormDataCard,
  TicketCommentsSection,
  TicketManagementCard,
  TicketAccessCard,
} from '../../components/tickets';

import { ticketTypeApi } from '../../api/ticketTypeApi';
import { ticketApi } from '../../api/ticketApi';
import { getOrgUsers } from '../../api/employeeApi';
import type { TicketStatusDTO } from '../../types/ticket';
import type { User } from '../../types/user';

export const TicketDetailsPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const canManage = true;
  const canWrite = true;

  const {
    ticket,
    loading,
    error,
    isForbidden,
    updateStatus,
    assignTicket,
    setTicket,
  } = useTicketDetails(ticketId);

  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleRequestAccess = async () => {
    if (!ticketId) return;
    setRequestStatus('loading');
    setRequestError(null);
    try {
      await ticketApi.requestAccess(ticketId);
      setRequestStatus('success');
    } catch (err: unknown) {
      setRequestStatus('error');
      const msg = (err as ApiError)?.message || 'Failed to send access request. Please try again.';
      setRequestError(msg);
    }
  };

  const [availableStatuses, setAvailableStatuses] = React.useState<TicketStatusDTO[]>([]);
  const [availableAssignees, setAvailableAssignees] = React.useState<User[]>([]);
  const [formSchema, setFormSchema] = React.useState<Record<string, unknown> | null>(
    ticket?.ticketType?.formSchema || null
  );

  React.useEffect(() => {
    const rawSchema = ticket?.ticketType?.formSchema;
    const hasValidFields = rawSchema && (
      Array.isArray((rawSchema as { fields?: unknown[] }).fields) ||
      Array.isArray(rawSchema)
    );

    if (hasValidFields) {
      setFormSchema(rawSchema);
    } else if (ticket?.ticketType?.id) {
      ticketTypeApi.getTicketTypeById(ticket.ticketType.id)
        .then((res) => {
          if (res?.formSchema) setFormSchema(res.formSchema);
        })
        .catch(() => {});
    }
  }, [ticket?.ticketType]);

  React.useEffect(() => {
    if (ticket?.ticketType?.id) {
      ticketTypeApi.getTicketStatuses(ticket.ticketType.id)
        .then((res) => {
          if (Array.isArray(res)) setAvailableStatuses(res);
        })
        .catch(() => {});
    }
  }, [ticket?.ticketType?.id]);

  React.useEffect(() => {
    getOrgUsers()
      .then((res) => {
        if (Array.isArray(res)) setAvailableAssignees(res);
      })
      .catch(() => {});
  }, []);

  const {
    comments,
    commentText,
    setCommentText,
    submitting,
    handleSubmitComment,
  } = useTicketComments({
    ticketId,
    comments: ticket?.comments,
    initialComments: ticket?.comments,
    onCommentAdded: (newComment) => {
      setTicket((prev) => (prev ? { ...prev, comments: [...prev.comments, newComment] } : prev));
    },
  });

  const { user } = useAuth();
  const [accessRefreshTrigger, setAccessRefreshTrigger] = useState(0);
  const [escalating, setEscalating] = useState(false);
  const [escalateSuccess, setEscalateSuccess] = useState<string | null>(null);
  const [escalateError, setEscalateError] = useState<string | null>(null);

  const canEscalate = canUserEscalateTicket(ticket, user?.id);

  const handleEscalate = async () => {
    if (!ticketId || escalating) return;
    setEscalating(true);
    setEscalateError(null);
    setEscalateSuccess(null);
    try {
      const updatedTicket = await ticketApi.escalateTicket(ticketId);
      setTicket(updatedTicket);
      setAccessRefreshTrigger((prev) => prev + 1);
      setEscalateSuccess('Ticket has been escalated. The assignee’s manager has been notified.');
    } catch (err: unknown) {
      const msg = (err as ApiError)?.message || 'Failed to escalate ticket. Please try again.';
      setEscalateError(msg);
    } finally {
      setEscalating(false);
    }
  };

  React.useEffect(() => {
    if (ticketId && ticket) {
      const label = ticket.displayId?.trim() || ticket.title?.trim() || 'Ticket Details';
      useBreadcrumbStore.getState().setLabel(ticketId, label);
    }
  }, [ticketId, ticket]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await updateStatus(e.target.value);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleAssigneeChange = async (
    assigneeIdOrEvent: string | null | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const assigneeId =
      typeof assigneeIdOrEvent === 'object' && assigneeIdOrEvent !== null && 'target' in assigneeIdOrEvent
        ? (assigneeIdOrEvent.target.value === '' ? null : assigneeIdOrEvent.target.value)
        : assigneeIdOrEvent;
    try {
      await assignTicket(assigneeId);
      // Refresh access list so newly added core participants appear immediately
      setAccessRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to reassign ticket');
    }
  };

  const handleCommentSubmit = async (
    e: React.FormEvent,
    formattedContent?: string,
    attachments?: string[]
  ) => {
    try {
      await handleSubmitComment(e, formattedContent, attachments);
      // Refresh access list and reload ticket details (for audit history)
      setAccessRefreshTrigger((prev) => prev + 1);
      if (ticketId) {
        ticketApi.getTicketDetails(ticketId).then((fresh) => {
          setTicket(fresh);
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 w-full space-y-6">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-6">
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs text-center" role="region" aria-label="Access Restricted">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
            You do not have access to this ticket{ticketId ? ` (${ticketId})` : ''}. If you need to view or work on this ticket, you can request access from the creator and assignee.
          </p>

          {requestStatus === 'success' ? (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-center gap-2.5 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Access request sent. The ticket creator and assignee have been notified.</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.TICKETS.BASE)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Requests</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {requestStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{requestError || 'Failed to request access.'}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRequestAccess}
                  disabled={requestStatus === 'loading'}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  {requestStatus === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Requesting Access...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Request Access</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.TICKETS.BASE)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Back to Requests
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 xl:p-10 w-full">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl flex items-start gap-3 shadow-xs" role="alert">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Request Not Found</h3>
            <p className="text-xs text-red-700 mt-1">{error || 'This support ticket could not be found.'}</p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.TICKETS.BASE)}
              className="mt-3 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayReference =
    ticket?.displayId?.trim() || ticket?.title?.trim() || 'Ticket Details';

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      {/* Top Header & Breadcrumbs Bar */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.TICKETS.BASE)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Requests</span>
            </button>

            <span className="text-slate-300">•</span>

            <nav className="flex items-center gap-1.5 text-xs text-slate-400">
              <Link to={ROUTES.TICKETS.BASE} className="hover:text-slate-600 transition-colors">
                Queue
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="font-mono text-slate-700 font-semibold">{displayReference}</span>
            </nav>
          </div>

          {canEscalate && (
            <button
              type="button"
              onClick={handleEscalate}
              disabled={escalating}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-400 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              {escalating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flame className="w-3.5 h-3.5 fill-rose-200" />}
              <span>Escalate Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6">
        {escalateSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{escalateSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setEscalateSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {escalateError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{escalateError}</span>
            </div>
            <button
              type="button"
              onClick={() => setEscalateError(null)}
              className="text-rose-700 hover:text-rose-900 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <TicketHeader
          ticket={ticket}
          canEscalate={canEscalate}
          onEscalate={handleEscalate}
          escalating={escalating}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-6">
            <TicketFormDataCard formData={ticket.formData} formSchema={formSchema || ticket.ticketType?.formSchema} />
            <TicketCommentsSection
              comments={comments}
              commentText={commentText}
              onCommentTextChange={setCommentText}
              submitting={submitting}
              onSubmit={handleCommentSubmit}
              canWrite={canWrite}
              history={ticket.history}
              availableUsers={availableAssignees}
            />
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-6">
            <TicketManagementCard
              currentStatus={ticket.currentStatus}
              assignee={ticket.assignee}
              availableStatuses={availableStatuses}
              availableAssignees={availableAssignees}
              canManage={canManage}
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
            />

            <TicketAccessCard
              ticketId={ticket.id}
              refreshTrigger={accessRefreshTrigger}
              onAccessChanged={() => {
                ticketApi.getTicketDetails(ticket.id).then((fresh) => {
                  setTicket(fresh);
                }).catch(() => {});
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { PageHeaderSkeleton, CardSkeleton } from '../../components/common/Skeletons';
import { useTicketDetails, useTicketComments } from '../../hooks';
import { ROUTES } from '../../constants';
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
    updateStatus,
    assignTicket,
    setTicket,
  } = useTicketDetails(ticketId);

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

  const [accessRefreshTrigger, setAccessRefreshTrigger] = useState(0);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await updateStatus(e.target.value);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assigneeId = e.target.value === '' ? null : e.target.value;
    try {
      await assignTicket(assigneeId);
    } catch (err) {
      console.error(err);
      alert('Failed to reassign ticket');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    try {
      await handleSubmitComment(e);
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
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="space-y-6">
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
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

  const displayReference = ticket.displayId || `#${ticket.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      {/* Top Header & Breadcrumbs Bar */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        <TicketHeader ticket={ticket} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <TicketFormDataCard formData={ticket.formData} formSchema={formSchema || ticket.ticketType?.formSchema} />
            <TicketCommentsSection
              comments={comments}
              commentText={commentText}
              onCommentTextChange={setCommentText}
              submitting={submitting}
              onSubmit={handleCommentSubmit}
              canWrite={canWrite}
              history={ticket.history}
            />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
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

import React from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../../store/authStore';
import { useTicketDetails, useTicketComments } from '../../hooks';
import {
  TicketHeader,
  TicketFormDataCard,
  TicketCommentsSection,
  TicketManagementCard,
  TicketAuditHistoryCard,
} from '../../components/tickets';

export const TicketDetailsPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { hasPrivilege } = useAuth();

  const canManage = hasPrivilege('TICKET_MANAGEMENT');
  const canWrite = hasPrivilege('TICKET_WRITE');

  const {
    ticket,
    loading,
    error,
    updateStatus,
    assignTicket,
    setTicket,
  } = useTicketDetails(ticketId);

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
    } catch (err) {
      console.error(err);
      alert('Failed to add comment');
    }
  };

  if (loading) return <div className="p-8 text-center" data-testid="loading">Loading ticket details...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!ticket) return <div className="p-8">Ticket not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <TicketHeader ticket={ticket} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          <TicketFormDataCard formData={ticket.formData} />
          <TicketCommentsSection
            comments={comments}
            commentText={commentText}
            onCommentTextChange={setCommentText}
            submitting={submitting}
            onSubmit={handleCommentSubmit}
            canWrite={canWrite}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TicketManagementCard
            currentStatus={ticket.currentStatus}
            assignee={ticket.assignee}
            canManage={canManage}
            onStatusChange={handleStatusChange}
            onAssigneeChange={handleAssigneeChange}
          />
          <TicketAuditHistoryCard history={ticket.history} />
        </div>
      </div>
    </div>
  );
};

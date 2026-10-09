import { PageHeaderSkeleton, CardSkeleton } from '../../components/common/Skeletons';
import React from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router';
import { useAuth } from '../../store/authStore';
import { useTicketDetails, useTicketComments } from '../../hooks';
import { ROUTES } from '../../constants';
import { Box, Breadcrumbs, Link, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  TicketHeader,
  TicketFormDataCard,
  TicketCommentsSection,
  TicketManagementCard,
  TicketAuditHistoryCard,
} from '../../components/tickets';

export const TicketDetailsPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
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

  if (loading) return (
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
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!ticket) return <div className="p-8">Ticket not found</div>;

  const shortId = ticket.id.substring(0, 8);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Breadcrumbs + Back */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(ROUTES.TICKETS.BASE)}
          sx={{ textTransform: 'none' }}
        >
          Back to Tickets
        </Button>
        <Breadcrumbs aria-label="breadcrumb" sx={{ flex: 1 }}>
          <Link component={RouterLink} to={ROUTES.TICKETS.BASE} underline="hover" color="inherit">
            Tickets
          </Link>
          <Typography color="text.primary">Ticket #{shortId}</Typography>
        </Breadcrumbs>
      </Box>

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
    </Box>
  );
};

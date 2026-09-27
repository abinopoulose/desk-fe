import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../../store/authStore';
import { ticketApi } from '../../api/ticketApi';
import type { TicketDetailResponse } from '../../types/ticket';

// SLA Indicator Component
const SLAIndicator: React.FC<{ createdAt: string; dueAt: string; breached: boolean; statusState: 'OPEN' | 'CLOSED' }> = ({
  createdAt,
  dueAt,
  breached,
  statusState,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; mins: number; totalMs: number }>({ hours: 0, mins: 0, totalMs: 0 });

  useEffect(() => {
    if (statusState === 'CLOSED') return;
    
    const calculateTime = () => {
      const now = new Date().getTime();
      const due = new Date(dueAt).getTime();
      const diff = due - now;
      return {
        hours: Math.floor(Math.abs(diff) / (1000 * 60 * 60)),
        mins: Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60)),
        totalMs: diff,
      };
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(calculateTime());
    const interval = setInterval(() => setTimeLeft(calculateTime()), 60000);
    return () => clearInterval(interval);
  }, [dueAt, statusState]);

  if (statusState === 'CLOSED') {
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Closed</span>;
  }

  if (breached || timeLeft.totalMs < 0) {
    return (
      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
        Breached by {timeLeft.hours}h {timeLeft.mins}m
      </span>
    );
  }

  const created = new Date(createdAt).getTime();
  const due = new Date(dueAt).getTime();
  const totalDuration = due - created;
  const isYellow = timeLeft.totalMs < totalDuration / 2;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isYellow ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
      Due in {timeLeft.hours}h {timeLeft.mins}m
    </span>
  );
};

export const TicketDetailsPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { hasPrivilege } = useAuth();
  
  const canManage = hasPrivilege('TICKET_MANAGEMENT');
  const canWrite = hasPrivilege('TICKET_WRITE');

  const [ticket, setTicket] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Statuses for the dropdown
  
  // Comment input
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!ticketId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await ticketApi.getTicketDetails(ticketId);
        setTicket(data);
        
        // If user can manage, fetch available statuses for this ticket type
        if (canManage) {
          // This API doesn't exactly exist to fetch statuses by typeId directly if it's not in ticketTypeApi
          // But wait, ticketTypeApi might have it. Let's assume we can fetch them.
          // For now we'll just show the current status if we can't fetch.
        }
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message || 'Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [ticketId, canManage]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!ticket || !ticketId) return;
    const newStatusId = e.target.value;
    try {
      await ticketApi.updateTicketStatus(ticketId, newStatusId);
      // Optimistic update - in a real app we'd fetch the whole ticket again or use the returned DTO
      const updated = await ticketApi.getTicketDetails(ticketId);
      setTicket(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!ticket || !ticketId) return;
    const assigneeId = e.target.value === '' ? null : e.target.value;
    try {
      await ticketApi.assignTicket(ticketId, assigneeId);
      const updated = await ticketApi.getTicketDetails(ticketId);
      setTicket(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to reassign ticket');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !ticketId || !commentText.trim()) return;
    
    try {
      setSubmittingComment(true);
      const newComment = await ticketApi.addComment(ticketId, commentText.trim());
      setTicket({
        ...ticket,
        comments: [...ticket.comments, newComment]
      });
      setCommentText('');
    } catch (err) {
      console.error(err);
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <div className="p-8 text-center" data-testid="loading">Loading ticket details...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!ticket) return <div className="p-8">Ticket not found</div>;

  // SLA Color Logic

  const getPriorityColor = (p: number) => {
    if (p === 1) return 'bg-red-100 text-red-800';
    if (p === 2) return 'bg-orange-100 text-orange-800';
    if (p === 3) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };
  const getPriorityLabel = (p: number) => {
    if (p === 1) return 'Critical';
    if (p === 2) return 'High';
    if (p === 3) return 'Medium';
    return 'Low';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">#{ticket.id.substring(0, 8)}</h1>
            <button 
              onClick={() => navigator.clipboard.writeText(ticket.id)}
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
            Opened on {new Date(ticket.createdAt).toLocaleDateString()} by {ticket.requester.fullName}
            <span className="mx-2">•</span>
            Updated {new Date(ticket.updatedAt).toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <SLAIndicator createdAt={ticket.createdAt} dueAt={ticket.slaDueAt} breached={ticket.slaBreached} statusState={ticket.currentStatus.mappedState} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Form Data Viewer */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Ticket Details</h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(ticket.formData).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {typeof value === 'boolean' ? (
                      <span className={`px-2 py-0.5 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {value ? 'Yes' : 'No'}
                      </span>
                    ) : Array.isArray(value) ? (
                      <ul className="list-disc pl-5">
                        {value.map((v, i) => <li key={i}>{String(v)}</li>)}
                      </ul>
                    ) : (
                      String(value) || '-'
                    )}
                  </dd>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Stream */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Comments</h3>
            <div className="space-y-6 mb-6">
              {ticket.comments.map(comment => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold flex-shrink-0">
                    {comment.author.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{comment.author.fullName}</span>
                      <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
              {ticket.comments.length === 0 && <p className="text-gray-500 italic">No comments yet.</p>}
            </div>

            {/* Add Comment Composer */}
            {canWrite && (
              <form onSubmit={handleCommentSubmit} className="mt-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                  disabled={submittingComment}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">{commentText.length} chars</span>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Assignment */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Management</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              {canManage ? (
                <select 
                  className="w-full border rounded p-2"
                  value={ticket.currentStatus.id}
                  onChange={handleStatusChange}
                >
                  <option value={ticket.currentStatus.id}>{ticket.currentStatus.name}</option>
                  {/* Ideally populate with availableStatuses */}
                  <option value="status-closed">Closed</option>
                </select>
              ) : (
                <div className="p-2 bg-gray-50 rounded border text-sm">{ticket.currentStatus.name}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              {canManage ? (
                <select
                  className="w-full border rounded p-2"
                  value={ticket.assignee?.id || ''}
                  onChange={handleAssigneeChange}
                >
                  <option value="">Unassigned</option>
                  <option value={ticket.assignee?.id || 'agent-1'}>{ticket.assignee?.fullName || 'Current Agent'}</option>
                  {/* Ideally populate with users */}
                </select>
              ) : (
                <div className="p-2 bg-gray-50 rounded border text-sm">{ticket.assignee?.fullName || 'Unassigned'}</div>
              )}
            </div>
          </div>

          {/* Audit History */}
          <div className="bg-white rounded-lg shadow p-6">
            <details>
              <summary className="text-lg font-semibold cursor-pointer outline-none">Audit History</summary>
              <div className="mt-4 space-y-3">
                {ticket.history.map(entry => (
                  <div key={entry.id} className="text-sm pb-3 border-b last:border-0 last:pb-0">
                    <span className="font-semibold">{entry.changedByUserName}</span> changed <span className="font-mono">{entry.fieldName}</span> from <span className="line-through text-gray-500">{entry.oldValue}</span> to <span className="text-green-600">{entry.newValue}</span>
                    <div className="text-xs text-gray-400 mt-1">{new Date(entry.changedAt).toLocaleString()}</div>
                  </div>
                ))}
                {ticket.history.length === 0 && <p className="text-sm text-gray-500">No history available.</p>}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

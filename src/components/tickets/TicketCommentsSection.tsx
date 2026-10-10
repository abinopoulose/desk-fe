import React from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import type { CommentDTO } from '../../types/ticket';

const MAX_CHARS = 500;

/** Relative time helper */
const relativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export interface TicketCommentsSectionProps {
  comments: CommentDTO[];
  commentText: string;
  onCommentTextChange: (text: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  canWrite: boolean;
}

export const TicketCommentsSection: React.FC<TicketCommentsSectionProps> = ({
  comments = [],
  commentText,
  onCommentTextChange,
  submitting,
  onSubmit,
  canWrite,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Activity & Comments</h3>
            <p className="text-xs text-slate-400">Communication history on this request</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {comments.length} {comments.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Comments Timeline */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No updates or comments have been posted yet. Start the conversation below.
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {comment.author?.fullName ? comment.author.fullName.charAt(0).toUpperCase() : 'U'}
              </div>

              <div className="flex-1 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {comment.author?.fullName || 'User'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {relativeTime(comment.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Input Form */}
      {canWrite ? (
        <form onSubmit={onSubmit} className="pt-2 border-t border-slate-100 space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              maxLength={MAX_CHARS}
              placeholder="Leave a comment or update for the team..."
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {commentText.length} / {MAX_CHARS} characters
            </span>

            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Post Comment</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-slate-50 text-slate-400 text-xs text-center rounded-xl border border-slate-100">
          You don't have write permissions to comment on this request.
        </div>
      )}
    </div>
  );
};

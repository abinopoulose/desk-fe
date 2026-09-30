import React from 'react';
import { Link } from 'react-router';
import type { CommentDTO } from '../../types/ticket';

export interface TicketCommentsSectionProps {
  comments: CommentDTO[];
  commentText: string;
  onCommentTextChange: (text: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  canWrite: boolean;
}

export const TicketCommentsSection: React.FC<TicketCommentsSectionProps> = ({
  comments,
  commentText,
  onCommentTextChange,
  submitting,
  onSubmit,
  canWrite,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">Comments</h3>
      <div className="space-y-6 mb-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold flex-shrink-0">
              {comment.author.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  to={`/users/${comment.author.id}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {comment.author.fullName}
                </Link>
                <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-gray-500 italic">No comments yet.</p>}
      </div>

      {canWrite && (
        <form onSubmit={onSubmit} className="mt-4">
          <textarea
            value={commentText}
            onChange={(e) => onCommentTextChange(e.target.value)}
            placeholder="Write a comment..."
            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            disabled={submitting}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{commentText.length} chars</span>
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

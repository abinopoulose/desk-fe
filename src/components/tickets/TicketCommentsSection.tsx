import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageSquare,
  History,
  Send,
  Loader2,
  ChevronDown,
  AtSign,
  Share2,
  Trash2
} from 'lucide-react';
import { getOrgUsers } from '../../api/employeeApi';
import type { CommentDTO, TicketHistoryDTO } from '../../types/ticket';
import type { User } from '../../types/user';

const MAX_CHARS = 500;
const INITIAL_VISIBLE_COUNT = 10;
const LOAD_MORE_STEP = 20;

/** Relative time helper */
const relativeTime = (dateStr?: string): string => {
  if (!dateStr) return 'just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return 'just now';
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

/** Render comment content with highlighted mentions */
const renderCommentText = (content: string) => {
  // Matches structured mentions @[Name](uuid) or simple @Word
  const parts: React.ReactNode[] = [];
  const regex = /(@\[([^\]]+)\]\([a-f0-9\\-]+\)|@[a-zA-Z0-9._%+-]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    const token = match[0];
    const nameMatch = token.match(/@\[([^\]]+)\]/);
    const displayName = nameMatch ? `@${nameMatch[1]}` : token;

    parts.push(
      <span
        key={match.index}
        className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mx-0.5"
      >
        {displayName}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

export interface TicketCommentsSectionProps {
  comments: CommentDTO[];
  commentText: string;
  onCommentTextChange: (text: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  canWrite: boolean;
  history?: TicketHistoryDTO[];
  defaultTab?: 'comments' | 'history';
}

export const TicketCommentsSection: React.FC<TicketCommentsSectionProps> = ({
  comments = [],
  commentText,
  onCommentTextChange,
  submitting,
  onSubmit,
  canWrite = true,
  history = [],
  defaultTab = 'comments',
}) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>(defaultTab);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState<number>(INITIAL_VISIBLE_COUNT);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // Mention autocomplete state
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load org users once for mentions
  useEffect(() => {
    getOrgUsers()
      .then((users) => {
        if (Array.isArray(users)) {
          setOrgUsers(users.filter((u) => u.status === 'ACTIVE'));
        }
      })
      .catch(() => {});
  }, []);

  // Filtered users for mention autocomplete
  const filteredUsers = useMemo(() => {
    if (!mentionQuery) return orgUsers.slice(0, 5);
    const q = mentionQuery.toLowerCase();
    return orgUsers
      .filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 5);
  }, [orgUsers, mentionQuery]);

  // Handle textarea input changes & mention trigger
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onCommentTextChange(text);

    // Detect if cursor is after an '@'
    const cursorPos = e.target.selectionStart || text.length;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex >= textBeforeCursor.length - 20) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  // Select mention
  const handleSelectMention = (user: User) => {
    if (!textareaRef.current) return;
    const text = commentText;
    const cursorPos = textareaRef.current.selectionStart || text.length;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const mentionToken = `@[${user.fullName}](${user.id}) `;
      const newText = text.substring(0, lastAtIndex) + mentionToken + text.substring(cursorPos);
      onCommentTextChange(newText);
    }
    setShowMentionMenu(false);
    textareaRef.current.focus();
  };

  // Always show latest comments first
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [comments]);

  const visibleComments = useMemo(() => {
    return sortedComments.slice(0, visibleCommentsCount);
  }, [sortedComments, visibleCommentsCount]);

  const hasMoreComments = sortedComments.length > visibleCommentsCount;
  const remainingCommentsCount = sortedComments.length - visibleCommentsCount;
  const nextBatchCommentsCount = Math.min(LOAD_MORE_STEP, remainingCommentsCount);

  // Always show latest history first
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const timeA = a.changedAt ? new Date(a.changedAt).getTime() : 0;
      const timeB = b.changedAt ? new Date(b.changedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [history]);

  const visibleHistory = useMemo(() => {
    return sortedHistory.slice(0, visibleHistoryCount);
  }, [sortedHistory, visibleHistoryCount]);

  const hasMoreHistory = sortedHistory.length > visibleHistoryCount;
  const remainingHistoryCount = sortedHistory.length - visibleHistoryCount;
  const nextBatchHistoryCount = Math.min(LOAD_MORE_STEP, remainingHistoryCount);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Browser Tab Strip */}
      <div className="bg-slate-100/80 px-4 pt-3 border-b border-slate-200/90 flex items-center justify-between gap-2 select-none">
        <div className="flex items-end gap-1.5 -mb-px" role="tablist" aria-label="Ticket Activity and History">
          {/* Tab 1: Comments */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'comments'}
            aria-controls="panel-comments"
            id="tab-comments"
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'comments'
                ? 'bg-white text-slate-900 border-slate-200/90 shadow-2xs z-10'
                : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border-transparent'
            }`}
          >
            <MessageSquare className={`w-3.5 h-3.5 ${activeTab === 'comments' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Comments</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'comments' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {sortedComments.length}
            </span>
          </button>

          {/* Tab 2: Audit History */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            aria-controls="panel-history"
            id="tab-history"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 border-slate-200/90 shadow-2xs z-10'
                : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border-transparent'
            }`}
          >
            <History className={`w-3.5 h-3.5 ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Audit History</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'history' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {sortedHistory.length}
            </span>
          </button>
        </div>

        {/* Right side summary helper */}
        <div className="hidden sm:flex items-center text-[11px] text-slate-400 pb-2">
          {activeTab === 'comments' ? (
            <span>
              {sortedComments.length} {sortedComments.length === 1 ? 'message' : 'messages'}
            </span>
          ) : (
            <span>
              {sortedHistory.length} {sortedHistory.length === 1 ? 'event' : 'events'}
            </span>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-6">
        {/* Comments Tab Panel */}
        {activeTab === 'comments' && (
          <div id="panel-comments" role="tabpanel" aria-labelledby="tab-comments" className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Comments</h3>
                  <p className="text-xs text-slate-400">Communication history on this request (newest first)</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {sortedComments.length} {sortedComments.length === 1 ? 'message' : 'messages'}
              </span>
            </div>

            {/* Reply Input Form */}
            {canWrite ? (
              <form onSubmit={onSubmit} className="pb-3 border-b border-slate-100 space-y-3 relative">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    rows={3}
                    maxLength={MAX_CHARS}
                    placeholder="Leave a comment... Type @ to mention a teammate"
                    value={commentText}
                    onChange={handleTextChange}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  />

                  {/* Mention Autocomplete Popover */}
                  {showMentionMenu && filteredUsers.length > 0 && (
                    <div className="absolute left-3 bottom-12 z-20 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 w-64 space-y-0.5 animate-in fade-in duration-100">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <AtSign className="w-3 h-3 text-indigo-600" />
                        Mention Teammate
                      </div>
                      {filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectMention(u)}
                          className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-indigo-50 text-left transition-colors cursor-pointer"
                        >
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-slate-800 truncate">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
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

            {/* Comments Timeline */}
            <div className="space-y-4">
              {visibleComments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No updates or comments have been posted yet. Start the conversation above.
                </div>
              ) : (
                visibleComments.map((comment) => (
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

                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {renderCommentText(comment.content)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load More Comments */}
            {hasMoreComments && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{visibleComments.length}</span> of{' '}
                  <span className="font-semibold text-slate-700">{sortedComments.length}</span> comments
                </span>
                <button
                  type="button"
                  onClick={() => setVisibleCommentsCount((prev) => prev + LOAD_MORE_STEP)}
                  className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Load {nextBatchCommentsCount} More Comments</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Audit History Tab Panel */}
        {activeTab === 'history' && (
          <div id="panel-history" role="tabpanel" aria-labelledby="tab-history" className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Audit History</h3>
                  <p className="text-xs text-slate-400">Lifecycle, sharing, and modification timeline (newest first)</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {sortedHistory.length} {sortedHistory.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            {/* Audit History Entries */}
            <div className="space-y-3">
              {visibleHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No historical changes recorded for this request.
                </div>
              ) : (
                visibleHistory.map((entry) => (
                  <div key={entry.id} className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {entry.changedByUserName ? entry.changedByUserName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {entry.changedByUserName || 'System User'}
                        </span>
                      </div>
                      <span
                        className="text-[11px] text-slate-400"
                        title={entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ''}
                      >
                        {relativeTime(entry.changedAt)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 pl-8">
                      {entry.fieldName === 'share' ? (
                        <div className="flex items-center gap-2 text-indigo-700 font-medium bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                          <Share2 className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                          <span>{entry.newValue}</span>
                        </div>
                      ) : entry.fieldName === 'unshare' ? (
                        <div className="flex items-center gap-2 text-rose-600 font-medium bg-rose-50/70 p-2 rounded-lg border border-rose-100">
                          <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                          <span>Access revoked for {entry.oldValue}</span>
                        </div>
                      ) : (
                        <div>
                          Updated{' '}
                          <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                            {entry.fieldName}
                          </span>{' '}
                          from <span className="line-through text-slate-400">{entry.oldValue || 'none'}</span> to{' '}
                          <span className="font-semibold text-emerald-700">{entry.newValue || 'none'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load More History */}
            {hasMoreHistory && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{visibleHistory.length}</span> of{' '}
                  <span className="font-semibold text-slate-700">{sortedHistory.length}</span> events
                </span>
                <button
                  type="button"
                  onClick={() => setVisibleHistoryCount((prev) => prev + LOAD_MORE_STEP)}
                  className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Load {nextBatchHistoryCount} More Events</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const TicketActivityTabs = TicketCommentsSection;
export type TicketActivityTabsProps = TicketCommentsSectionProps;

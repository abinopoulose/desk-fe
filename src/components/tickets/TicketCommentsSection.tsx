import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  History,
  Send,
  Loader2,
  ChevronDown,
  AtSign,
  Share2,
  Trash2,
  Paperclip,
  FileText,
  X,
  Download,
  User as UserIcon,
  Mail,
  Copy,
  Check,
  Briefcase,
  Building,
} from 'lucide-react';
import { getOrgUsers } from '../../api/employeeApi';
import { getUserProfile } from '../../api/userApi';
import type { CommentDTO, TicketHistoryDTO } from '../../types/ticket';
import type { User, UserProfileResponse } from '../../types/user';
import { getUserInitial } from '../../utils/userUtils';
import { UserProfileModal } from '../user/UserProfileModal';

const MAX_CHARS = 1000;
const INITIAL_VISIBLE_COUNT = 10;
const LOAD_MORE_STEP = 20;

/** Relative time helper */
export const relativeTime = (dateStr?: string): string => {
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

export interface CommentAttachmentItem {
  name: string;
  size?: number;
  type?: string;
  url: string;
}

/** Parses raw attachment string (JSON or URL or DataURL) */
export const parseCommentAttachment = (raw: string): CommentAttachmentItem => {
  if (typeof raw === 'string' && raw.trim().startsWith('{') && raw.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || 'attachment',
        size: parsed.size,
        type: parsed.type || (parsed.url?.startsWith('data:image') ? 'image/png' : 'application/octet-stream'),
        url: parsed.url || parsed.data || '',
      };
    } catch {
      // fallback to plain URL handling
    }
  }

  let name = 'attachment';
  let type = 'application/octet-stream';
  if (typeof raw === 'string') {
    if (raw.startsWith('data:image')) {
      type = 'image/png';
      name = 'image.png';
    } else if (raw.startsWith('http')) {
      const parts = raw.split('/');
      name = parts[parts.length - 1].split('?')[0] || 'attachment';
      if (name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        type = 'image/' + name.split('.').pop()?.toLowerCase();
      }
    }
  }
  return { name, type, url: raw };
};

/** Formats byte size into human readable string */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Transforms clean drafting mentions (@FullName) into structured backend format (@[FullName](uuid)).
 * Preserves any mentions already in structured format.
 */
export const formatContentForSubmission = (text: string, users: User[]): string => {
  if (!text) return '';
  let result = text;
  // Sort users by full name length descending to prevent partial match collisions
  const sorted = [...users]
    .filter((u) => u.fullName && u.id)
    .sort((a, b) => b.fullName.length - a.fullName.length);

  for (const u of sorted) {
    const escapedName = u.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Only match @FullName if not already inside @[FullName](...)
    const regex = new RegExp(`@${escapedName}(?![\\w\\]\\)])`, 'g');
    result = result.replace(regex, `@[${u.fullName}](${u.id})`);
  }
  return result;
};

export interface MentionBadgeProps {
  displayName: string;
  userId?: string;
  user?: User;
}

/** Rendered mention block with profile picture, rich hover card, and Microsoft Teams-style profile modal */
export const MentionBadge: React.FC<MentionBadgeProps> = ({ displayName, userId, user }) => {
  const [showCard, setShowCard] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fetchedUser, setFetchedUser] = useState<UserProfileResponse | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanName = displayName.replace(/^@/, '');
  const targetUserId = userId || user?.id;
  const effectiveUser = fetchedUser || user;
  const finalName = effectiveUser?.fullName || cleanName;
  const effectiveEmail = effectiveUser?.email || '';
  const initial = getUserInitial(finalName);
  const profilePictureUrl = effectiveUser?.profilePictureUrl;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowCard(true);

    // Fetch full profile details if user lacks email or metadata
    if (targetUserId && (!user || !user.email) && !fetchedUser) {
      getUserProfile(targetUserId)
        .then((data) => {
          setFetchedUser(data);
        })
        .catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowCard(false);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveEmail) {
      navigator.clipboard.writeText(effectiveEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleOpenProfileModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCard(false);
    setIsModalOpen(true);
  };

  return (
    <>
      <span
        className="relative inline-flex items-center align-baseline mx-0.5"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span
          tabIndex={0}
          role="button"
          aria-haspopup="dialog"
          aria-expanded={showCard}
          onClick={handleOpenProfileModal}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200/70 hover:border-indigo-300 transition-all cursor-pointer select-none shadow-2xs"
          data-testid="mention-badge"
        >
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={finalName}
              className="w-3.5 h-3.5 rounded-full object-cover shrink-0 pointer-events-none"
            />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-200 text-indigo-800 text-[9px] font-bold inline-flex items-center justify-center shrink-0 pointer-events-none">
              {initial}
            </span>
          )}
          <span>{displayName}</span>
        </span>

        {/* Rich Hover Info Card */}
        {showCard && (
          <div
            role="dialog"
            aria-label={`User information for ${finalName}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute bottom-full left-0 mb-2 z-50 w-80 p-4 bg-white rounded-2xl shadow-xl border border-slate-200/90 text-left animate-in fade-in zoom-in-95 duration-150"
            style={{ minWidth: '19rem' }}
          >
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full border border-slate-200 bg-indigo-50 text-indigo-700 flex items-center justify-center text-base font-bold overflow-hidden shadow-2xs">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt={finalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    (effectiveUser as any)?.status === 'ACTIVE' || (effectiveUser as any)?.isActive !== false
                      ? 'bg-emerald-500'
                      : 'bg-slate-400'
                  }`}
                  title="Active"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 truncate" title={finalName}>
                    {finalName}
                  </h4>
                  {effectiveUser?.displayId && (
                    <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                      {effectiveUser.displayId}
                    </span>
                  )}
                </div>

                {/* Email Address with Copy action */}
                <div className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span
                    className="text-xs truncate font-mono text-slate-600"
                    title={effectiveEmail || 'No email available'}
                  >
                    {effectiveEmail || 'No email available'}
                  </span>
                  {effectiveEmail && (
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors ml-auto shrink-0 cursor-pointer"
                      title="Copy email address"
                    >
                      {copiedEmail ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* Job Title, Department & Role badges */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {effectiveUser?.title && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 truncate max-w-[150px]">
                      <Briefcase className="w-2.5 h-2.5 text-slate-400" />
                      <span>{effectiveUser.title}</span>
                    </span>
                  )}
                  {effectiveUser?.departmentName && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-[150px]">
                      <Building className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{effectiveUser.departmentName}</span>
                    </span>
                  )}
                  {(!effectiveUser?.title &&
                    !effectiveUser?.departmentName &&
                    effectiveUser?.roles &&
                    effectiveUser.roles.length > 0) && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {effectiveUser.roles[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* View Profile Action Button */}
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleOpenProfileModal}
                className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-200/60 shadow-2xs"
                data-testid="view-profile-btn"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>View Profile</span>
              </button>
            </div>
          </div>
        )}
      </span>

      {/* Microsoft Teams Style Profile Modal with Hierarchy Graph */}
      <UserProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={targetUserId || null}
        initialUser={effectiveUser}
      />
    </>
  );
};

/** Render comment content with highlighted mentions and hover card */
export const renderCommentText = (content: string, orgUsers: User[] = []) => {
  if (!content) return null;
  // Matches structured mentions @[Name](uuid) or simple @Word
  const parts: React.ReactNode[] = [];
  const regex = /(@\[([^\]]+)\]\(([^)]+)\)|@[a-zA-Z0-9._%+-]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    const token = match[0];
    const structuredMatch = token.match(/@\[([^\]]+)\]\(([^)]+)\)/);

    let displayName = token;
    let userId: string | undefined;
    let matchedUser: User | undefined;

    if (structuredMatch) {
      displayName = `@${structuredMatch[1]}`;
      userId = structuredMatch[2];
      matchedUser = orgUsers.find(
        (u) =>
          u.id === userId ||
          u.fullName.toLowerCase() === structuredMatch[1].toLowerCase()
      );
    } else {
      const cleanToken = token.replace(/^@/, '');
      matchedUser = orgUsers.find(
        (u) => u.fullName.toLowerCase() === cleanToken.toLowerCase()
      );
      if (matchedUser) {
        userId = matchedUser.id;
      }
    }

    parts.push(
      <MentionBadge
        key={match.index}
        displayName={displayName}
        userId={userId}
        user={matchedUser}
      />
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
  onSubmit: (e: React.FormEvent, formattedContent?: string, attachments?: string[], taggedUserIds?: string[]) => void;
  canWrite: boolean;
  history?: TicketHistoryDTO[];
  defaultTab?: 'comments' | 'history';
  availableUsers?: User[];
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
  availableUsers,
}) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>(defaultTab);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState<number>(INITIAL_VISIBLE_COUNT);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // Mention autocomplete state
  const [loadedUsers, setLoadedUsers] = useState<User[]>([]);
  const orgUsers = useMemo(() => {
    if (availableUsers && availableUsers.length > 0) {
      return availableUsers.filter((u) => (u as any).status !== 'INACTIVE');
    }
    return loadedUsers;
  }, [availableUsers, loadedUsers]);

  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setEditorRef = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (node && !Object.getOwnPropertyDescriptor(node, 'value')) {
      let internalVal = node.textContent || '';
      Object.defineProperty(node, 'value', {
        get() {
          return internalVal;
        },
        set(val: string) {
          internalVal = val;
          node.textContent = val;
          const lastAtIndex = val.lastIndexOf('@');
          if (lastAtIndex !== -1 && lastAtIndex >= val.length - 25) {
            const query = val.substring(lastAtIndex + 1);
            if (!query.includes(' ') && !query.includes('[')) {
              setMentionQuery(query);
              setShowMentionMenu(true);
              return;
            }
          }
          setShowMentionMenu(false);
        },
        configurable: true,
      });
    }
  }, []);

  // Draft file attachments
  const [draftAttachments, setDraftAttachments] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Load org users once for mentions if availableUsers not provided
  useEffect(() => {
    if (availableUsers && availableUsers.length > 0) return;
    getOrgUsers()
      .then((users) => {
        if (Array.isArray(users)) {
          setLoadedUsers(users.filter((u) => u.status === 'ACTIVE'));
        }
      })
      .catch(() => {});
  }, [availableUsers]);

  // Filtered users for mention autocomplete
  const filteredUsers = useMemo(() => {
    if (!mentionQuery) return orgUsers.slice(0, 5);
    const q = mentionQuery.toLowerCase();
    return orgUsers
      .filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 5);
  }, [orgUsers, mentionQuery]);

  // Synchronize editor contents to text representation and tagged user IDs
  const serializeEditor = useCallback(() => {
    if (!editorRef.current) return { displayText: '', formattedContent: '', taggedUserIds: [] };
    let displayText = '';
    let formattedContent = '';
    const taggedUserIds: string[] = [];

    const traverse = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        displayText += text;
        formattedContent += text;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.getAttribute('data-mention-unit') === 'true') {
          const userId = el.getAttribute('data-user-id') || '';
          const userName = el.getAttribute('data-user-name') || '';
          displayText += `@${userName}`;
          formattedContent += `@[${userName}](${userId})`;
          if (userId && !taggedUserIds.includes(userId)) {
            taggedUserIds.push(userId);
          }
        } else if (el.tagName === 'BR') {
          displayText += '\n';
          formattedContent += '\n';
        } else {
          el.childNodes.forEach(traverse);
        }
      }
    };

    editorRef.current.childNodes.forEach(traverse);
    return { displayText, formattedContent, taggedUserIds };
  }, []);

  const syncState = useCallback(() => {
    const { displayText } = serializeEditor();
    onCommentTextChange(displayText);
  }, [serializeEditor, onCommentTextChange]);

  // Sync external commentText changes into the editor when cleared or initialized
  useEffect(() => {
    if (!commentText && editorRef.current && editorRef.current.innerHTML !== '') {
      editorRef.current.innerHTML = '';
    } else if (commentText && editorRef.current && !(editorRef.current.textContent || '').trim()) {
      editorRef.current.textContent = commentText;
    }
  }, [commentText]);

  // Check whether cursor is currently following an '@' symbol
  const checkMentionTrigger = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) {
      setShowMentionMenu(false);
      return;
    }
    try {
      const range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.endContainer)) {
        setShowMentionMenu(false);
        return;
      }
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const textBeforeCaret = preCaretRange.toString();

      const lastAtIndex = textBeforeCaret.lastIndexOf('@');
      if (lastAtIndex !== -1 && lastAtIndex >= textBeforeCaret.length - 25) {
        const query = textBeforeCaret.substring(lastAtIndex + 1);
        if (!query.includes(' ') && !query.includes('\n') && !query.includes('[')) {
          setMentionQuery(query);
          setShowMentionMenu(true);
          return;
        }
      }
    } catch {
      // Ignored
    }
    setShowMentionMenu(false);
  }, []);

  // Handle typing input
  const handleInput = () => {
    syncState();
    checkMentionTrigger();
  };

  // Support fireEvent.change from Testing Library / synthetic inputs
  const handleChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    const targetVal = (e.target as any).value;
    if (typeof targetVal === 'string' && editorRef.current) {
      editorRef.current.innerText = targetVal;
      syncState();
      const lastAtIndex = targetVal.lastIndexOf('@');
      if (lastAtIndex !== -1 && lastAtIndex >= targetVal.length - 25) {
        const query = targetVal.substring(lastAtIndex + 1);
        if (!query.includes(' ') && !query.includes('[')) {
          setMentionQuery(query);
          setShowMentionMenu(true);
          return;
        }
      }
      setShowMentionMenu(false);
    }
  };

  // Atomic Backspace / Delete handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection && selection.isCollapsed && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const offset = range.startOffset;

        // Case 1: Caret is inside a text node following a mention unit
        if (container.nodeType === Node.TEXT_NODE) {
          if (offset === 0) {
            const prev = container.previousSibling;
            if (prev && (prev as HTMLElement).getAttribute?.('data-mention-unit') === 'true') {
              e.preventDefault();
              prev.remove();
              syncState();
              checkMentionTrigger();
              return;
            }
          } else if (
            offset === 1 &&
            (container.textContent?.[0] === ' ' || container.textContent?.[0] === '\u00A0')
          ) {
            const prev = container.previousSibling;
            if (prev && (prev as HTMLElement).getAttribute?.('data-mention-unit') === 'true') {
              e.preventDefault();
              container.textContent = container.textContent.substring(1);
              prev.remove();
              syncState();
              checkMentionTrigger();
              return;
            }
          }
        }
        // Case 2: Caret is inside an element node (e.g. editor container)
        else if (container.nodeType === Node.ELEMENT_NODE) {
          const prevChild = container.childNodes[offset - 1];
          if (prevChild) {
            if ((prevChild as HTMLElement).getAttribute?.('data-mention-unit') === 'true') {
              e.preventDefault();
              prevChild.remove();
              syncState();
              checkMentionTrigger();
              return;
            }
            if (
              prevChild.nodeType === Node.TEXT_NODE &&
              (prevChild.textContent === ' ' || prevChild.textContent === '\u00A0')
            ) {
              const beforeSpace = container.childNodes[offset - 2];
              if (beforeSpace && (beforeSpace as HTMLElement).getAttribute?.('data-mention-unit') === 'true') {
                e.preventDefault();
                beforeSpace.remove();
                prevChild.remove();
                syncState();
                checkMentionTrigger();
                return;
              }
            }
          }
        }
      }

      // Fallback for end of editor or collapsed range with no offset
      if (editorRef.current) {
        const lastChild = editorRef.current.lastChild;
        if (lastChild) {
          if ((lastChild as HTMLElement).getAttribute?.('data-mention-unit') === 'true') {
            e.preventDefault();
            lastChild.remove();
            syncState();
            checkMentionTrigger();
            return;
          }
          if (
            lastChild.nodeType === Node.TEXT_NODE &&
            (lastChild.textContent === ' ' || lastChild.textContent === '\u00A0' || !lastChild.textContent)
          ) {
            const beforeLast = lastChild.previousSibling;
            if (beforeLast && (beforeLast as HTMLElement).getAttribute?.('data-mention-unit') === 'true') {
              e.preventDefault();
              beforeLast.remove();
              lastChild.remove();
              syncState();
              checkMentionTrigger();
              return;
            }
          }
        }
      }
    } else if (e.key === 'Delete') {
      const selection = window.getSelection();
      if (selection && selection.isCollapsed && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const offset = range.startOffset;

        if (container.nodeType === Node.TEXT_NODE) {
          if (offset === (container.textContent?.length || 0)) {
            const next = container.nextSibling;
            if (next && (next as HTMLElement).getAttribute?.('data-mention-unit') === 'true') {
              e.preventDefault();
              next.remove();
              syncState();
              checkMentionTrigger();
              return;
            }
          }
        } else if (container.nodeType === Node.ELEMENT_NODE) {
          const nextChild = container.childNodes[offset];
          if (nextChild && (nextChild as HTMLElement).getAttribute?.('data-mention-unit') === 'true') {
            e.preventDefault();
            nextChild.remove();
            syncState();
            checkMentionTrigger();
            return;
          }
        }
      }
    } else if (e.key === 'Escape') {
      setShowMentionMenu(false);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      checkMentionTrigger();
    }
  };

  // Select mention: Inserts atomic mention pill with avatar picture that deletes in one backspace
  const handleSelectMention = (user: User) => {
    if (!editorRef.current) return;

    const mentionSpan = document.createElement('span');
    mentionSpan.className =
      'mention-unit inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold select-none text-[11px] align-baseline mx-0.5 shadow-2xs';
    mentionSpan.contentEditable = 'false';
    mentionSpan.setAttribute('data-mention-unit', 'true');
    mentionSpan.setAttribute('data-user-id', user.id);
    mentionSpan.setAttribute('data-user-name', user.fullName);
    mentionSpan.setAttribute('data-profile-url', user.profilePictureUrl || '');

    if (user.profilePictureUrl) {
      const img = document.createElement('img');
      img.src = user.profilePictureUrl;
      img.alt = user.fullName;
      img.className = 'w-3.5 h-3.5 rounded-full object-cover shrink-0 pointer-events-none';
      mentionSpan.appendChild(img);
    } else {
      const initial = document.createElement('span');
      initial.className =
        'w-3.5 h-3.5 rounded-full bg-indigo-200 text-indigo-800 text-[9px] font-bold inline-flex items-center justify-center shrink-0 pointer-events-none';
      initial.textContent = getUserInitial(user.fullName);
      mentionSpan.appendChild(initial);
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'pointer-events-none';
    nameSpan.textContent = `@${user.fullName}`;
    mentionSpan.appendChild(nameSpan);

    const spaceNode = document.createTextNode(' ');

    const selection = window.getSelection();
    let replaced = false;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE && editorRef.current.contains(container)) {
        const text = container.textContent || '';
        const offset = range.startOffset;
        const textBefore = text.substring(0, offset);
        const lastAt = textBefore.lastIndexOf('@');
        if (lastAt !== -1) {
          const textBeforeAt = text.substring(0, lastAt);
          const textAfterOffset = text.substring(offset);
          container.textContent = textBeforeAt;

          const parent = container.parentNode || editorRef.current;
          const nextNode = container.nextSibling;

          parent.insertBefore(mentionSpan, nextNode);
          parent.insertBefore(spaceNode, nextNode);

          if (textAfterOffset) {
            const afterNode = document.createTextNode(textAfterOffset);
            parent.insertBefore(afterNode, nextNode);
          }

          try {
            const newRange = document.createRange();
            newRange.setStartAfter(spaceNode);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch {
            // In jsdom
          }
          replaced = true;
        }
      }
    }

    if (!replaced) {
      const currentText = editorRef.current.innerText || editorRef.current.textContent || '';
      const lastAt = currentText.lastIndexOf('@');
      editorRef.current.innerHTML = '';
      if (lastAt > 0) {
        editorRef.current.appendChild(document.createTextNode(currentText.substring(0, lastAt)));
      }
      editorRef.current.appendChild(mentionSpan);
      editorRef.current.appendChild(spaceNode);
      try {
        if (selection) {
          const newRange = document.createRange();
          newRange.setStartAfter(spaceNode);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } catch {
        // In jsdom
      }
    }

    setShowMentionMenu(false);
    syncState();
    editorRef.current.focus();
  };

  // Convert File to JSON attachment string
  const readFileAsAttachment = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const payload = JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: dataUrl,
        });
        resolve(payload);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // File selection handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const newAtts = await Promise.all(files.map(readFileAsAttachment));
      setDraftAttachments((prev) => [...prev, ...newAtts]);
    } catch (err) {
      console.error('Failed to read attached file', err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    try {
      const newAtts = await Promise.all(files.map(readFileAsAttachment));
      setDraftAttachments((prev) => [...prev, ...newAtts]);
    } catch (err) {
      console.error('Failed to read dropped file', err);
    }
  };

  const handleRemoveDraftAttachment = (indexToRemove: number) => {
    setDraftAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Form submission with mention formatting and attachments
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { formattedContent, taggedUserIds } = serializeEditor();
    const contentToSubmit = formattedContent.trim()
      ? formattedContent
      : formatContentForSubmission(commentText, orgUsers);

    if (!contentToSubmit.trim() && draftAttachments.length === 0) return;

    // Gather any additional user IDs from contentToSubmit regex
    const finalTaggedIds = [...taggedUserIds];
    const mentionRegex = /@\[[^\]]+\]\(([a-f0-9\\-]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = mentionRegex.exec(contentToSubmit)) !== null) {
      if (m[1] && !finalTaggedIds.includes(m[1])) {
        finalTaggedIds.push(m[1]);
      }
    }

    onSubmit(e, contentToSubmit, draftAttachments, finalTaggedIds);
    setDraftAttachments([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
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
              <form onSubmit={handleFormSubmit} className="pb-4 border-b border-slate-100 space-y-3 relative">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-2xl transition-all ${
                    isDragging ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                  }`}
                >
                  <div
                    ref={setEditorRef}
                    contentEditable={canWrite}
                    role="textbox"
                    aria-multiline="true"
                    {...({ placeholder: 'Leave a comment... Type @ to mention a teammate, or attach files below' } as Record<string, string>)}
                    data-placeholder="Leave a comment... Type @ to mention a teammate, or attach files below"
                    onInput={handleInput}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    className="w-full min-h-[84px] max-h-[220px] overflow-y-auto p-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none empty:before:select-none"
                  />

                  {/* Mention Autocomplete Popover */}
                  {showMentionMenu && filteredUsers.length > 0 && (
                    <div className="absolute left-3 bottom-14 z-20 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 w-64 space-y-0.5 animate-in fade-in duration-100">
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
                          {u.profilePictureUrl ? (
                            <img
                              src={u.profilePictureUrl}
                              alt={u.fullName}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {getUserInitial(u.fullName)}
                            </div>
                          )}
                          <div className="truncate min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Draft Attachments Preview Strip (Jira-style) */}
                {draftAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 pb-1">
                    {draftAttachments.map((raw, idx) => {
                      const att = parseCommentAttachment(raw);
                      const isImage = att.type?.startsWith('image/') || att.url?.startsWith('data:image');

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100/90 border border-slate-200/90 rounded-xl text-xs text-slate-700 group shadow-2xs"
                        >
                          {isImage ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-5 h-5 rounded object-cover shrink-0"
                            />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                          <span className="font-medium text-slate-800 truncate max-w-[140px]" title={att.name}>
                            {att.name}
                          </span>
                          {att.size && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              ({formatFileSize(att.size)})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftAttachment(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                            title="Remove attachment"
                            aria-label={`Remove ${att.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Hidden File Input for Attachments */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload comment attachment"
                />

                {/* Composer Toolbar */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span>Attach files</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {commentText.length} / {MAX_CHARS} characters
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || (!commentText.trim() && draftAttachments.length === 0)}
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
            <div className="space-y-5">
              {visibleComments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No updates or comments have been posted yet. Start the conversation above.
                </div>
              ) : (
                visibleComments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    {/* Author Avatar on the left */}
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-indigo-200/60 shadow-2xs overflow-hidden">
                      {getUserInitial(comment.author?.fullName)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Author Name and Timestamp OUTSIDE the comment box */}
                      <div className="flex items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {comment.author?.fullName || 'User'}
                          </span>
                          {comment.author?.email && (
                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              {comment.author.email}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {relativeTime(comment.createdAt)}
                        </span>
                      </div>

                      {/* Comment Box itself (strictly content & attachments) */}
                      <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                        <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {renderCommentText(comment.content, orgUsers)}
                        </div>

                        {/* Attachments Section in Comment (Jira-style) */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="pt-2.5 border-t border-slate-200/70 space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              <span>Attachments ({comment.attachments.length})</span>
                            </div>

                            <div className="flex flex-wrap gap-2.5">
                              {comment.attachments.map((raw, idx) => {
                                const att = parseCommentAttachment(raw);
                                const isImage =
                                  att.type?.startsWith('image/') ||
                                  att.url?.startsWith('data:image') ||
                                  att.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

                                if (isImage) {
                                  return (
                                    <div
                                      key={idx}
                                      className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs hover:shadow-xs transition-all max-w-[220px]"
                                    >
                                      <img
                                        src={att.url}
                                        alt={att.name}
                                        className="h-28 w-auto max-w-[220px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                        onClick={() => window.open(att.url, '_blank')}
                                      />
                                      <div className="p-1.5 bg-white/95 border-t border-slate-100 flex items-center justify-between gap-1">
                                        <span className="text-[11px] font-medium text-slate-700 truncate max-w-[140px]" title={att.name}>
                                          {att.name}
                                        </span>
                                        <a
                                          href={att.url}
                                          download={att.name}
                                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                                          title={`Download ${att.name}`}
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-colors"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[160px]" title={att.name}>
                                        {att.name}
                                      </p>
                                      {att.size && (
                                        <p className="text-[10px] text-slate-400">{formatFileSize(att.size)}</p>
                                      )}
                                    </div>
                                    <a
                                      href={att.url}
                                      download={att.name}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors ml-1 cursor-pointer"
                                      title={`Download ${att.name}`}
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
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
                          {getUserInitial(entry.changedByUserName)}
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

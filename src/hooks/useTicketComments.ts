import { useState, useEffect, useCallback, useRef } from 'react';
import { ticketApi } from '../api/ticketApi';
import type { CommentDTO } from '../types/ticket';
import type { ApiError } from '../utils/apiErrorHandler';

export interface UseTicketCommentsOptions {
  ticketId?: string;
  comments?: CommentDTO[];
  initialComments?: CommentDTO[];
  onCommentAdded?: (comment: CommentDTO) => void;
  fetchSeparately?: boolean;
}

export interface UseTicketCommentsReturn {
  comments: CommentDTO[];
  setComments: React.Dispatch<React.SetStateAction<CommentDTO[]>>;
  loadingComments: boolean;
  commentsError: string | null;
  fetchComments: (id?: string) => Promise<CommentDTO[]>;
  commentText: string;
  setCommentText: React.Dispatch<React.SetStateAction<string>>;
  submitting: boolean;
  submittingComment: boolean;
  submitError: string | null;
  error: string | null;
  addTicketComment: (content?: string) => Promise<CommentDTO | undefined>;
  addComment: (content?: string) => Promise<CommentDTO | undefined>;
  handleSubmitComment: (e?: React.FormEvent) => Promise<CommentDTO | undefined>;
  handleCommentSubmit: (e?: React.FormEvent) => Promise<CommentDTO | undefined>;
  resetForm: () => void;
}

function areCommentsEqual(a?: CommentDTO[], b?: CommentDTO[]): boolean {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].content !== b[i].content || a[i].createdAt !== b[i].createdAt) {
      return false;
    }
  }
  return true;
}

export function useTicketComments(
  optionsOrTicketId?: string | UseTicketCommentsOptions,
  initialCommentsArg?: CommentDTO[]
): UseTicketCommentsReturn {
  const options: UseTicketCommentsOptions =
    typeof optionsOrTicketId === 'string'
      ? { ticketId: optionsOrTicketId, initialComments: initialCommentsArg }
      : optionsOrTicketId || {};

  const { ticketId, comments: liveComments, initialComments, onCommentAdded, fetchSeparately = false } = options;

  const [internalComments, setInternalComments] = useState<CommentDTO[]>(
    liveComments || initialComments || []
  );

  const prevInitialRef = useRef<CommentDTO[] | undefined>(initialComments);

  useEffect(() => {
    if (!areCommentsEqual(initialComments, prevInitialRef.current)) {
      prevInitialRef.current = initialComments;
      if (initialComments) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInternalComments(initialComments);
      }
    }
  }, [initialComments]);

  const comments = liveComments !== undefined ? liveComments : internalComments;

  const setComments = useCallback<React.Dispatch<React.SetStateAction<CommentDTO[]>>>((action) => {
    setInternalComments(action);
  }, []);

  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchComments = useCallback(
    async (id?: string): Promise<CommentDTO[]> => {
      const targetId = id || ticketId;
      if (!targetId) return [];

      if (isMountedRef.current) {
        setLoadingComments(true);
        setCommentsError(null);
      }

      try {
        const data = await ticketApi.getComments(targetId);
        if (isMountedRef.current) {
          setInternalComments(data);
          prevInitialRef.current = data;
        }
        return data;
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const message = (err as ApiError)?.message || 'Failed to fetch comments';
          setCommentsError(message);
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setLoadingComments(false);
        }
      }
    },
    [ticketId]
  );

  useEffect(() => {
    const load = async () => {
      if (fetchSeparately && ticketId) {
        try {
          await fetchComments(ticketId);
        } catch {
          // Handled in fetchComments
        }
      }
    };
    load();
  }, [fetchSeparately, ticketId, fetchComments]);

  const addTicketComment = useCallback(
    async (content?: string): Promise<CommentDTO | undefined> => {
      const text = (content !== undefined ? content : commentText).trim();
      if (!ticketId || !text) return undefined;

      if (isMountedRef.current) {
        setSubmitting(true);
        setSubmitError(null);
      }

      try {
        const newComment = await ticketApi.addComment(ticketId, text);
        if (isMountedRef.current) {
          setInternalComments((prev) => [...prev, newComment]);
          setCommentText('');
        }
        onCommentAdded?.(newComment);
        return newComment;
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const message = (err as ApiError)?.message || 'Failed to add comment';
          setSubmitError(message);
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setSubmitting(false);
        }
      }
    },
    [ticketId, commentText, onCommentAdded]
  );

  const handleSubmitComment = useCallback(
    async (e?: React.FormEvent): Promise<CommentDTO | undefined> => {
      if (e) {
        e.preventDefault();
      }
      return addTicketComment();
    },
    [addTicketComment]
  );

  const resetForm = useCallback(() => {
    setCommentText('');
    setSubmitError(null);
  }, []);

  return {
    comments,
    setComments,
    loadingComments,
    commentsError,
    fetchComments,
    commentText,
    setCommentText,
    submitting,
    submittingComment: submitting,
    submitError,
    error: submitError || commentsError,
    addTicketComment,
    addComment: addTicketComment,
    handleSubmitComment,
    handleCommentSubmit: handleSubmitComment,
    resetForm,
  };
}

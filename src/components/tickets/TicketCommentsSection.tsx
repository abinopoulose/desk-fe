import React from 'react';
import { Link } from 'react-router';
import {
  Box, Typography, Avatar, TextField, Button, CircularProgress, Stack,
} from '@mui/material';
import { Comment as CommentIcon, Send as SendIcon } from '@mui/icons-material';
import { EmptyState } from '../common/EmptyState';
import type { CommentDTO } from '../../types/ticket';

const MAX_CHARS = 500;

/** Deterministic colour from a string */
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colours = [
    '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00',
    '#0288d1', '#c2185b', '#455a64', '#5d4037', '#00796b',
  ];
  return colours[Math.abs(hash) % colours.length];
};

/** Relative time helper (no external deps) */
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
  return new Date(dateStr).toLocaleDateString();
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
  comments,
  commentText,
  onCommentTextChange,
  submitting,
  onSubmit,
  canWrite,
}) => {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
        Comments
      </Typography>

      <Stack spacing={2.5} sx={{ mb: 3 }} aria-live="polite">
        {comments.length === 0 ? (
          <EmptyState
            icon={<CommentIcon />}
            title="No comments yet"
            description="Be the first to add a comment."
          />
        ) : (
          comments.map((comment) => (
            <Box key={comment.id} sx={{ display: 'flex', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: stringToColor(comment.author.fullName),
                  width: 36,
                  height: 36,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {comment.author.fullName.charAt(0).toUpperCase()}
              </Avatar>
              <Box
                sx={{
                  flex: 1,
                  borderLeft: 3,
                  borderColor: 'primary.main',
                  pl: 2,
                  py: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Link
                    to={`/users/${comment.author.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                      {comment.author.fullName}
                    </Typography>
                  </Link>
                  <Typography variant="caption" color="text.secondary">
                    {relativeTime(comment.createdAt)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Stack>

      {canWrite && (
        <Box component="form" onSubmit={onSubmit}>
          <TextField
            value={commentText}
            onChange={(e) => onCommentTextChange(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Write a comment…"
            multiline
            minRows={3}
            maxRows={6}
            fullWidth
            disabled={submitting}
            size="small"
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {commentText.length} / {MAX_CHARS} characters
            </Typography>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={!commentText.trim() || submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
            >
              {submitting ? 'Posting…' : 'Post Comment'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

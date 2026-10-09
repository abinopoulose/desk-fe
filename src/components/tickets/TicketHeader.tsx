import { Warning, AccessTime } from "@mui/icons-material";
import React from 'react';
import { Chip, Box, Typography } from '@mui/material';
import { Link } from 'react-router';
import type { TicketDetailResponse } from '../../types/ticket';
import { getPriorityColor, getPriorityLabel } from '../../constants';
import { SLAIndicator } from './SLAIndicator';

export interface TicketHeaderProps {
  ticket: TicketDetailResponse;
  onCopyId?: () => void;
}

export const TicketHeader: React.FC<TicketHeaderProps> = ({ ticket, onCopyId }) => {
  const handleCopy = () => {
    if (onCopyId) {
      onCopyId();
    } else {
      navigator.clipboard.writeText(ticket.id);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
        p: 3,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 2,
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            #{ticket.id.substring(0, 8)}
          </Typography>
          <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Copy ID"
          >
            Copy
          </button>
          <Chip size="small" color={getPriorityColor(ticket.priority) as any} label={getPriorityLabel(ticket.priority)} icon={ticket.priority <= 2 ? <Warning fontSize="small" /> : <AccessTime fontSize="small" />} />
        </Box>
        <Typography variant="h6" color="text.primary">{ticket.ticketType.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Opened on {new Date(ticket.createdAt).toLocaleDateString()} by{' '}
          <Link to={`/users/${ticket.requester.id}`} className="text-blue-600 hover:underline">
            {ticket.requester.fullName}
          </Link>
          <span className="mx-2">•</span>
          Updated {new Date(ticket.updatedAt).toLocaleString()}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
        <SLAIndicator
          createdAt={ticket.createdAt}
          dueAt={ticket.slaDueAt}
          breached={ticket.slaBreached}
          statusState={ticket.currentStatus.mappedState}
        />
      </Box>
    </Box>
  );
};

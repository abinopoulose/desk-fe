import { motion, useReducedMotion } from "framer-motion";
import { Warning, AccessTime, CheckCircle, AssignmentLate } from "@mui/icons-material";
import { DataGridSkeleton } from '../../components/common/Skeletons';
import { EmptyState } from '../../components/common/EmptyState';
import { Inbox as InboxIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import {
  Box, TextField, InputAdornment, Chip, Card, CardActionArea,
  Stack, Typography, useMediaQuery, useTheme, Button, IconButton,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { ROUTES } from '../../constants';
import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../store/authStore';
import { useTicketList } from '../../hooks';
import { APP_CONFIG } from '../../constants';
import type { TicketDTO } from '../../types/ticket';

const PriorityChip: React.FC<{ priority: number }> = ({ priority }) => {
  const map: Record<number, { label: string; color: 'error' | 'warning' | 'info' | 'default'; icon?: React.ReactElement }> = {
    1: { label: 'Critical', color: 'error', icon: <Warning fontSize="small" /> },
    2: { label: 'High', color: 'warning', icon: <AccessTime fontSize="small" /> },
    3: { label: 'Medium', color: 'info', icon: <AccessTime fontSize="small" /> },
    4: { label: 'Low', color: 'default', icon: <AccessTime fontSize="small" /> },
  };
  const cfg = map[priority] || { label: `P${priority}`, color: 'default' as const, icon: <AccessTime fontSize="small" /> };
  return <Chip size="small" label={cfg.label} color={cfg.color} variant="outlined" icon={cfg.icon} />;
};

const StatusChip: React.FC<{ name: string; state: string }> = ({ name, state }) => (
  <Chip
    size="small"
    label={`${name} (${state})`} icon={state === 'CLOSED' ? <CheckCircle fontSize="small" /> : <AccessTime fontSize="small" />}
    color={state === 'OPEN' ? 'primary' : 'default'}
    variant="filled"
  />
);

const MobileTicketCard: React.FC<{ ticket: TicketDTO; onClick: () => void }> = ({ ticket: t, onClick }) => (
  <Card variant="outlined" sx={{ mb: 1 }}>
    <CardActionArea onClick={onClick} role="link" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, mr: 1 }}>
          {t.ticketTypeTitle}
        </Typography>
        <PriorityChip priority={t.priority} />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t.id.substring(0, 8)}… · {t.requesterName}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <StatusChip name={t.currentStatusName} state={t.mappedState} />
        {t.assigneeName ? (
          <Chip size="small" label={t.assigneeName} variant="outlined" />
        ) : (
          <Chip size="small" label="Unassigned" sx={{ bgcolor: 'grey.200' }} />
        )}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {new Date(t.createdAt).toLocaleDateString()}
        </Typography>
      </Box>
      {t.slaBreached && (
        <Chip size="small" label="SLA Breached" color="error" sx={{ mt: 1 }} icon={<AssignmentLate fontSize="small" />} />
      )}
    </CardActionArea>
  </Card>
);

export const TicketListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPrivilege } = useAuth();
  const canManage = hasPrivilege('TICKET_MANAGEMENT');

  const {
    tickets,
    loading,
    filters,
    setFilter,
    sort,
    handleSort,
    pagination,
  } = useTicketList();
  const shouldReduceMotion = useReducedMotion();
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 }, show: { opacity: 1, y: 0 } };

  const hasActiveFilters =
    !!filters.search || !!filters.status || !!filters.assigneeId ||
    filters.mappedState !== '' || filters.priority !== '';

  const clearAllFilters = () => {
    setFilter('search', '');
    setFilter('status', '');
    setFilter('assigneeId', '');
    setFilter('mappedState', '');
    setFilter('priority', '');
  };

  const renderSortIcon = (field: string) => {
    const [currentField, currentDir] = sort.split(',');
    if (currentField !== field) return null;
    return <span>{currentDir === 'asc' ? ' ▲' : ' ▼'}</span>;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Ticket Dashboard</Typography>
        <Button variant="contained" onClick={() => navigate(ROUTES.TICKETS.NEW)} size={isMobile ? 'small' : 'medium'}>
          New Ticket
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}>
        {[
          { key: 'my', label: 'My Tickets' },
          { key: 'assigned', label: 'Assigned to Me' },
          ...(canManage ? [{ key: 'all', label: 'All Tickets' }] : []),
        ].map((tab) => (
          <Button
            key={tab.key}
            size="small"
            onClick={() => setFilter('tab', tab.key as 'my' | 'assigned' | 'all')}
            sx={{
              borderBottom: filters.tab === tab.key ? 2 : 0,
              borderColor: 'primary.main',
              borderRadius: 0,
              fontWeight: filters.tab === tab.key ? 700 : 400,
              pb: 1,
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* Search & Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by ID or Requester"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          aria-label="Search tickets"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 220 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>State</InputLabel>
          <Select value={filters.mappedState} onChange={(e) => setFilter('mappedState', e.target.value)} label="State">
            {APP_CONFIG.TICKETS.STATE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} label="Priority">
            {APP_CONFIG.TICKETS.PRIORITY_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Per page</InputLabel>
          <Select value={pagination.size} onChange={(e) => pagination.setSize(Number(e.target.value))} label="Per page">
            {APP_CONFIG.TICKETS.PAGE_SIZE_OPTIONS.map((sz) => (
              <MenuItem key={sz} value={sz}>{sz}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <IconButton size="small" onClick={clearAllFilters} color="error" aria-label="Clear all filters">
            <ClearIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Content */}
      {loading ? (
        <DataGridSkeleton rows={8} columns={6} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<InboxIcon />}
          title="No tickets found"
          description="There are no tickets matching your current filters."
          action={hasActiveFilters ? { label: 'Clear Filters', onClick: clearAllFilters } : undefined}
        />
      ) : isMobile ? (
        /* Mobile: Card Layout */
        <Stack spacing={1}>
          {tickets.map((t) => (
            <motion.div key={t.id} variants={itemVariants}><MobileTicketCard ticket={t} onClick={() => navigate(ROUTES.TICKETS.DETAILS(t.id))} /></motion.div>
          ))}
        </Stack>
      ) : (
        /* Desktop: Table */
        <Box sx={{ overflowX: 'auto' }}>
          <table className="min-w-full bg-white border" style={{ borderCollapse: 'collapse' }}>
            <thead className="bg-gray-100">
              <motion.tr>
                <th className="py-2 px-4 border text-left">ID</th>
                <th className="py-2 px-4 border text-left">Type</th>
                <th className="py-2 px-4 border text-left">Requester</th>
                <th className="py-2 px-4 border text-left">Assignee</th>
                <th className="py-2 px-4 border text-left">Status</th>
                <th className="py-2 px-4 border text-left cursor-pointer" onClick={() => handleSort('priority')}>
                  Priority {renderSortIcon('priority')}
                </th>
                <th className="py-2 px-4 border text-left cursor-pointer" onClick={() => handleSort('slaDueAt')}>
                  SLA {renderSortIcon('slaDueAt')}
                </th>
                <th className="py-2 px-4 border text-left cursor-pointer" onClick={() => handleSort('createdAt')}>
                  Created {renderSortIcon('createdAt')}
                </th>
              </motion.tr>
            </thead>
            <motion.tbody initial="hidden" animate="show" variants={containerVariants}>
              {tickets.map((t) => (
                <motion.tr
                  key={t.id} variants={itemVariants}
                  onClick={() => navigate(ROUTES.TICKETS.DETAILS(t.id))}
                  className="hover:bg-gray-50 cursor-pointer"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(ROUTES.TICKETS.DETAILS(t.id))}
                >
                  <td className="py-2 px-4 border">{t.id.substring(0, 8)}...</td>
                  <td className="py-2 px-4 border">{t.ticketTypeTitle}</td>
                  <td className="py-2 px-4 border">{t.requesterName}</td>
                  <td className="py-2 px-4 border">
                    {t.assigneeName || <Chip size="small" label="Unassigned" sx={{ bgcolor: 'grey.200' }} />}
                  </td>
                  <td className="py-2 px-4 border">
                    <StatusChip name={t.currentStatusName} state={t.mappedState} />
                  </td>
                  <td className="py-2 px-4 border"><PriorityChip priority={t.priority} /></td>
                  <td className="py-2 px-4 border">
                    {t.slaBreached ? (
                      <Chip size="small" label="Breached" color="error" icon={<AssignmentLate fontSize="small" />} />
                    ) : (
                      <span>{t.slaDueAt ? new Date(t.slaDueAt).toLocaleString() : ''}</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border">{new Date(t.createdAt).toLocaleString()}</td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </Box>
      )}

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {pagination.totalElements === 0 ? 0 : pagination.page * pagination.size + 1}-
          {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of{' '}
          {pagination.totalElements} tickets
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button size="small" variant="outlined" disabled={pagination.page === 0} onClick={pagination.prevPage}>
            Previous
          </Button>
          <Typography variant="body2">
            Page {pagination.totalPages > 0 ? pagination.page + 1 : 0} of {pagination.totalPages}
          </Typography>
          <Button size="small" variant="outlined" disabled={pagination.page >= pagination.totalPages - 1} onClick={pagination.nextPage}>
            Next
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

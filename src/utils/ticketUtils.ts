export interface PriorityBadgeConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

/**
 * Returns Tailwind styling classes and label for a given priority level (1-4).
 */
export const getPriorityStyle = (priority?: number): PriorityBadgeConfig => {
  switch (priority) {
    case 1:
      return { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
    case 2:
      return { label: 'High', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 3:
      return { label: 'Medium', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    default:
      return { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };
  }
};

/**
 * Returns the human-readable display reference for a ticket.
 * Uses displayId (e.g. 'TECH-2') if present, or shortens the UUID (e.g. '#A1B2C3D4').
 */
export const getTicketDisplayReference = (
  ticket?: { displayId?: string; id?: string } | null
): string => {
  if (!ticket) return '';
  if (ticket.displayId && ticket.displayId.trim()) {
    return ticket.displayId.trim();
  }
  if (ticket.id && ticket.id.trim()) {
    return `#${ticket.id.trim().substring(0, 8).toUpperCase()}`;
  }
  return '';
};

/**
 * Determines whether a ticket has breached its SLA.
 */
export const isTicketSlaBreached = (
  ticket?: { slaBreached?: boolean; slaDueAt?: string } | null
): boolean => {
  if (!ticket) return false;
  if (ticket.slaBreached) return true;
  if (ticket.slaDueAt) {
    const dueTime = new Date(ticket.slaDueAt).getTime();
    if (!Number.isNaN(dueTime) && dueTime < Date.now()) {
      return true;
    }
  }
  return false;
};

/**
 * Checks whether the current user is eligible to escalate a ticket.
 * Conditions:
 * 1. User must be the ticket creator (requester).
 * 2. SLA must be breached.
 * 3. Ticket must not already be escalated.
 * 4. Ticket must not be CLOSED.
 */
export const canUserEscalateTicket = (
  ticket?: {
    requester?: { id?: string } | null;
    slaBreached?: boolean;
    slaDueAt?: string;
    escalated?: boolean;
    currentStatus?: { mappedState?: 'OPEN' | 'CLOSED' } | null;
  } | null,
  userId?: string | null
): boolean => {
  if (!ticket || !userId) return false;
  const isCreator = Boolean(ticket.requester?.id && ticket.requester.id === userId);
  const isBreached = isTicketSlaBreached(ticket);
  const isClosed = ticket.currentStatus?.mappedState === 'CLOSED';
  return isCreator && isBreached && !ticket.escalated && !isClosed;
};

import { describe, it, expect } from 'vitest';
import {
  getPriorityStyle,
  getTicketDisplayReference,
  isTicketSlaBreached,
  canUserEscalateTicket,
} from './ticketUtils';

describe('ticketUtils', () => {
  describe('getPriorityStyle', () => {
    it('returns critical config for priority 1', () => {
      const style = getPriorityStyle(1);
      expect(style.label).toBe('Critical');
      expect(style.text).toBe('text-rose-700');
    });

    it('returns high config for priority 2', () => {
      const style = getPriorityStyle(2);
      expect(style.label).toBe('High');
      expect(style.text).toBe('text-amber-700');
    });

    it('returns medium config for priority 3', () => {
      const style = getPriorityStyle(3);
      expect(style.label).toBe('Medium');
      expect(style.text).toBe('text-blue-700');
    });

    it('returns low config for priority 4 or undefined', () => {
      expect(getPriorityStyle(4).label).toBe('Low');
      expect(getPriorityStyle(undefined).label).toBe('Low');
    });
  });

  describe('getTicketDisplayReference', () => {
    it('returns displayId if present', () => {
      expect(getTicketDisplayReference({ displayId: 'ENG-42', id: 'uuid-1234' })).toBe('ENG-42');
    });

    it('formats short id fallback when displayId is absent', () => {
      expect(getTicketDisplayReference({ id: 'abcdef01-2345-6789' })).toBe('#ABCDEF01');
    });

    it('returns empty string for null or empty ticket', () => {
      expect(getTicketDisplayReference(null)).toBe('');
      expect(getTicketDisplayReference(undefined)).toBe('');
      expect(getTicketDisplayReference({})).toBe('');
    });
  });

  describe('isTicketSlaBreached', () => {
    it('returns true when slaBreached is explicitly true', () => {
      expect(isTicketSlaBreached({ slaBreached: true })).toBe(true);
    });

    it('returns true when slaDueAt is in the past', () => {
      const past = new Date(Date.now() - 60000).toISOString();
      expect(isTicketSlaBreached({ slaBreached: false, slaDueAt: past })).toBe(true);
    });

    it('returns false when slaDueAt is in the future and slaBreached is false', () => {
      const future = new Date(Date.now() + 60000).toISOString();
      expect(isTicketSlaBreached({ slaBreached: false, slaDueAt: future })).toBe(false);
    });

    it('returns false for null/empty ticket', () => {
      expect(isTicketSlaBreached(null)).toBe(false);
    });
  });

  describe('canUserEscalateTicket', () => {
    const creatorId = 'user-creator';
    const past = new Date(Date.now() - 60000).toISOString();

    it('returns true when user is creator, SLA is breached, open, and not escalated', () => {
      const ticket = {
        requester: { id: creatorId },
        slaDueAt: past,
        slaBreached: true,
        escalated: false,
        currentStatus: { mappedState: 'OPEN' as const },
      };
      expect(canUserEscalateTicket(ticket, creatorId)).toBe(true);
    });

    it('returns false when user is not the creator', () => {
      const ticket = {
        requester: { id: creatorId },
        slaDueAt: past,
        slaBreached: true,
        escalated: false,
        currentStatus: { mappedState: 'OPEN' as const },
      };
      expect(canUserEscalateTicket(ticket, 'other-user')).toBe(false);
    });

    it('returns false when ticket is already escalated', () => {
      const ticket = {
        requester: { id: creatorId },
        slaDueAt: past,
        slaBreached: true,
        escalated: true,
        currentStatus: { mappedState: 'OPEN' as const },
      };
      expect(canUserEscalateTicket(ticket, creatorId)).toBe(false);
    });

    it('returns false when ticket is closed', () => {
      const ticket = {
        requester: { id: creatorId },
        slaDueAt: past,
        slaBreached: true,
        escalated: false,
        currentStatus: { mappedState: 'CLOSED' as const },
      };
      expect(canUserEscalateTicket(ticket, creatorId)).toBe(false);
    });
  });
});

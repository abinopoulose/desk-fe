import { describe, it, expect } from 'vitest';
import { mergeTimeline } from './timelineUtils';
import type { AuditEntry } from '../types/audit';

describe('timelineUtils - mergeTimeline', () => {
  it('formats status, assignee, and priority changes correctly', () => {
    const history: AuditEntry[] = [
      {
        id: '1',
        ticketId: 't1',
        fieldName: 'status',
        oldValue: 'Open',
        newValue: 'In Progress',
        changedAt: '2026-10-18T10:00:00Z',
        changedBy: { id: 'u1', fullName: 'Alice Admin', email: 'alice@company.com' },
      },
      {
        id: '2',
        ticketId: 't1',
        fieldName: 'assignee',
        oldValue: 'Unassigned',
        newValue: 'Bob Specialist',
        changedAt: '2026-10-18T10:05:00Z',
        changedBy: { id: 'u1', fullName: 'Alice Admin', email: 'alice@company.com' },
      },
    ];

    const result = mergeTimeline(history, [], 'asc');
    expect(result).toHaveLength(2);
    expect(result[0].summary).toContain("Status changed from 'Open' to 'In Progress' by Alice Admin");
    expect(result[1].summary).toContain('Assigned to Bob Specialist by Alice Admin');
  });

  it('formats share and unshare audit events clearly', () => {
    const history: AuditEntry[] = [
      {
        id: '3',
        ticketId: 't1',
        fieldName: 'share',
        oldValue: null,
        newValue: 'Automatically shared ticket with Bob Specialist (bob@company.com) upon assignment',
        changedAt: '2026-10-18T10:05:00Z',
        changedBy: { id: 'u1', fullName: 'Alice Admin', email: 'alice@company.com' },
      },
      {
        id: '4',
        ticketId: 't1',
        fieldName: 'unshare',
        oldValue: 'Bob Specialist',
        newValue: null,
        changedAt: '2026-10-18T10:30:00Z',
        changedBy: { id: 'u1', fullName: 'Alice Admin', email: 'alice@company.com' },
      },
    ];

    const result = mergeTimeline(history, [], 'asc');
    expect(result).toHaveLength(2);
    expect(result[0].summary).toBe('Automatically shared ticket with Bob Specialist (bob@company.com) upon assignment');
    expect(result[1].summary).toBe('Access revoked for Bob Specialist by Alice Admin');
  });
});

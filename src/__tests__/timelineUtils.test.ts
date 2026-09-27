import { describe, it, expect } from 'vitest';
import { mergeTimeline } from '../utils/timelineUtils';
import type { AuditEntry } from '../types/audit';
import type { CommentDTO } from '../types/ticket';

describe('timelineUtils', () => {
  const mockUser = {
    id: '1',
    fullName: 'John Doe',
    email: 'john@example.com'
  };

  const mockHistory: AuditEntry[] = [
    {
      id: 'h1',
      ticketId: 't1',
      changedBy: mockUser,
      changedAt: '2023-10-10T10:00:00Z',
      fieldName: 'status',
      oldValue: 'Open',
      newValue: 'In Progress'
    },
    {
      id: 'h2',
      ticketId: 't1',
      changedBy: mockUser,
      changedAt: '2023-10-10T12:00:00Z',
      fieldName: 'assignee',
      oldValue: 'Unassigned',
      newValue: 'Jane Doe'
    },
    {
      id: 'h3',
      ticketId: 't1',
      changedBy: mockUser,
      changedAt: '2023-10-10T14:00:00Z',
      fieldName: 'priority',
      oldValue: 'Low',
      newValue: 'High'
    },
    {
      id: 'h4',
      ticketId: 't1',
      changedBy: mockUser,
      changedAt: '2023-10-10T16:00:00Z',
      fieldName: 'device',
      oldValue: 'Laptop',
      newValue: 'Desktop'
    }
  ];

  const mockComments: CommentDTO[] = [
    {
      id: 'c1',
      ticketId: 't1',
      author: mockUser,
      content: 'I will look into this.',
      createdAt: '2023-10-10T11:00:00Z'
    }
  ];

  it('merges and sorts timeline items in ascending order by default', () => {
    const timeline = mergeTimeline(mockHistory, mockComments);
    
    expect(timeline.length).toBe(5);
    
    // Check order
    expect(timeline[0].timestamp).toBe('2023-10-10T10:00:00Z');
    expect(timeline[0].type).toBe('STATUS_CHANGE');
    expect(timeline[0].summary).toBe("Status changed from 'Open' to 'In Progress' by John Doe");

    expect(timeline[1].timestamp).toBe('2023-10-10T11:00:00Z');
    expect(timeline[1].type).toBe('COMMENT');
    expect(timeline[1].summary).toBe("John Doe commented");
    expect(timeline[1].details).toBe("I will look into this.");

    expect(timeline[2].timestamp).toBe('2023-10-10T12:00:00Z');
    expect(timeline[2].type).toBe('ASSIGNEE_CHANGE');
    expect(timeline[2].summary).toBe("Assigned to Jane Doe by John Doe");

    expect(timeline[3].timestamp).toBe('2023-10-10T14:00:00Z');
    expect(timeline[3].type).toBe('PRIORITY_CHANGE');
    expect(timeline[3].summary).toBe("Priority changed from Low to High by John Doe");

    expect(timeline[4].timestamp).toBe('2023-10-10T16:00:00Z');
    expect(timeline[4].type).toBe('FIELD_CHANGE');
    expect(timeline[4].summary).toBe("device updated from 'Laptop' to 'Desktop'");
  });

  it('merges and sorts timeline items in descending order when specified', () => {
    const timeline = mergeTimeline(mockHistory, mockComments, 'desc');
    
    expect(timeline.length).toBe(5);
    expect(timeline[0].timestamp).toBe('2023-10-10T16:00:00Z');
    expect(timeline[4].timestamp).toBe('2023-10-10T10:00:00Z');
  });

  it('handles missing values gracefully', () => {
    const timeline = mergeTimeline([{
      id: 'h-missing',
      ticketId: 't1',
      changedBy: undefined as unknown as import('../types/audit').UserSummaryDTO,
      changedAt: '2023-10-10T10:00:00Z',
      fieldName: 'status',
      oldValue: null,
      newValue: null
    }], []);

    expect(timeline[0].summary).toBe("Status changed from 'None' to 'None' by Unknown User");
  });
});

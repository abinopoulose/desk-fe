import type { AuditEntry, TimelineItem } from '../types/audit';
import type { CommentDTO } from '../types/ticket';

export const mergeTimeline = (
  history: AuditEntry[],
  comments: CommentDTO[],
  sortOrder: 'asc' | 'desc' = 'asc'
): TimelineItem[] => {
  const items: TimelineItem[] = [];

  // Process history entries
  history.forEach((entry) => {
    let type: TimelineItem['type'];
    let summary: string;
    
    const actorName = entry.changedBy?.fullName || 'Unknown User';

    if (entry.fieldName === 'status') {
      type = 'STATUS_CHANGE';
      summary = `Status changed from '${entry.oldValue || 'None'}' to '${entry.newValue || 'None'}' by ${actorName}`;
    } else if (entry.fieldName === 'assignee') {
      type = 'ASSIGNEE_CHANGE';
      summary = `Assigned to ${entry.newValue || 'Unassigned'} by ${actorName}`;
    } else if (entry.fieldName === 'priority') {
      type = 'PRIORITY_CHANGE';
      summary = `Priority changed from ${entry.oldValue || 'None'} to ${entry.newValue || 'None'} by ${actorName}`;
    } else if (entry.fieldName === 'share') {
      type = 'FIELD_CHANGE';
      summary = entry.newValue || `Access shared by ${actorName}`;
    } else if (entry.fieldName === 'unshare') {
      type = 'FIELD_CHANGE';
      summary = `Access revoked for ${entry.oldValue || 'user'} by ${actorName}`;
    } else {
      type = 'FIELD_CHANGE';
      summary = `${entry.fieldName} updated from '${entry.oldValue || 'None'}' to '${entry.newValue || 'None'}'`;
    }

    items.push({
      id: `audit-${entry.id}`,
      type,
      timestamp: entry.changedAt,
      actor: entry.changedBy,
      summary,
    });
  });

  // Process comments
  comments.forEach((comment) => {
    const actorName = comment.author?.fullName || 'Unknown User';
    
    items.push({
      id: `comment-${comment.id}`,
      type: 'COMMENT',
      timestamp: comment.createdAt,
      actor: comment.author,
      summary: `${actorName} commented`,
      details: comment.content,
    });
  });

  // Sort
  items.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    
    if (sortOrder === 'desc') {
      return timeB - timeA;
    }
    return timeA - timeB;
  });

  return items;
};

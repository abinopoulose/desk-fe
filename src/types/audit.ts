export interface UserSummaryDTO {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface AuditEntry {
  id: string;
  ticketId: string;
  changedBy: UserSummaryDTO;
  changedAt: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface TimelineItem {
  id: string;
  type: 'STATUS_CHANGE' | 'ASSIGNEE_CHANGE' | 'PRIORITY_CHANGE' | 'FIELD_CHANGE' | 'COMMENT';
  timestamp: string;
  actor: UserSummaryDTO;
  summary: string;
  details?: string;
}

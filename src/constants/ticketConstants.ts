import { PRIORITY_COLORS } from "../theme/tokens";

export const TICKET_PRIORITY_LABELS: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

// Now mapping to MUI palette keys directly from tokens
export const TICKET_PRIORITY_COLORS: Record<number, string> = {
  1: PRIORITY_COLORS.critical,
  2: PRIORITY_COLORS.high,
  3: PRIORITY_COLORS.medium,
  4: PRIORITY_COLORS.low,
};

export const TICKET_PRIORITY_ITEMS = [
  { value: 1, label: 'Critical', colorClass: PRIORITY_COLORS.critical },
  { value: 2, label: 'High', colorClass: PRIORITY_COLORS.high },
  { value: 3, label: 'Medium', colorClass: PRIORITY_COLORS.medium },
  { value: 4, label: 'Low', colorClass: PRIORITY_COLORS.low },
];

export const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  'status-open': 'Open',
  'status-closed': 'Closed',
};

export const DEFAULT_CLOSED_STATUS_ID = 'status-closed';
export const DEFAULT_CLOSED_STATUS_NAME = 'Closed';

export function getPriorityLabel(priority: number): string {
  return TICKET_PRIORITY_LABELS[priority] ?? 'Low';
}

export function getPriorityColor(priority: number): string {
  return TICKET_PRIORITY_COLORS[priority] ?? 'bg-gray-100 text-gray-800';
}


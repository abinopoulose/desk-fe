export const TICKET_PRIORITY_LABELS: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

export const TICKET_PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-blue-100 text-blue-800',
  4: 'bg-gray-100 text-gray-800',
};

export const TICKET_PRIORITY_ITEMS = [
  { value: 1, label: 'Critical', colorClass: 'bg-red-100 text-red-800 border-red-200' },
  { value: 2, label: 'High', colorClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 3, label: 'Medium', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 4, label: 'Low', colorClass: 'bg-gray-100 text-gray-800 border-gray-200' },
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


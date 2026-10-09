export const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
];

export const PRIORITY_OPTIONS = [
  {
    value: 1,
    name: 'Critical',
    code: 'P1',
    description: 'Urgent blocker, work completely stopped',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  {
    value: 2,
    name: 'High',
    code: 'P2',
    description: 'High impact, major problem needing fast action',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  {
    value: 3,
    name: 'Medium',
    code: 'P3',
    description: 'Standard request or normal daily inquiry',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  {
    value: 4,
    name: 'Low',
    code: 'P4',
    description: 'Minor query or low urgency task',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
];

export const RESOLUTION_PRESETS = [
  { label: '2 Hours', minutes: 120 },
  { label: '4 Hours', minutes: 240 },
  { label: '8 Hours (1 Work Day)', minutes: 480 },
  { label: '24 Hours (1 Day)', minutes: 1440 },
  { label: '48 Hours (2 Days)', minutes: 2880 },
  { label: '3 Days', minutes: 4320 },
  { label: '5 Days (1 Week)', minutes: 7200 },
];

export function formatResolutionTime(minutes: number): string {
  if (!minutes || minutes <= 0) return 'Immediate';
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''}`;
  const hours = minutes / 60;
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} business day${days > 1 ? 's' : ''} (${hours} hrs)`;
  }
  if (minutes % 60 === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours.toFixed(1)} hours (${minutes} mins)`;
}

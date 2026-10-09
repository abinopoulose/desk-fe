export const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'error' | 'default'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
  default: 'default',
};

export const PRIORITY_COLORS: Record<string, 'info' | 'warning' | 'error' | 'default'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
  default: 'default',
};

export const LAYOUT = {
  SIDEBAR_WIDTH: 260,
  SIDEBAR_COLLAPSED_WIDTH: 64, // Common default
  APPBAR_HEIGHT: 64,
  CONTENT_MAX_WIDTH: 1200,
  FORM_MAX_WIDTH: 800,
  NARROW_MAX_WIDTH: 420,
};

export const SPACING = {
  xs: 1, // 8px
  sm: 2, // 16px
  md: 3, // 24px
  lg: 4, // 32px
  xl: 5, // 40px
};

export const CHART_PALETTE = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

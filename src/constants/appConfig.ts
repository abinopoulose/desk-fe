export const APP_NAME = (import.meta.env.VITE_APP_NAME as string) || 'Desk';

export const APP_CONFIG = {
  APP_NAME,
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  },
  DATE_RANGE_PRESETS: {
    TODAY: 'today',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
  },
  THEME: {
    DEFAULT: 'system',
    OPTIONS: ['light', 'dark', 'system'],
  },
  AUTH: {
    MIN_PASSWORD_LENGTH: 8,
  },
  TICKETS: {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50],
    DEFAULT_SORT: 'createdAt,desc',
    PRIORITY_OPTIONS: [
      { label: 'All Priorities', value: '' },
      { label: '1 - Critical', value: '1' },
      { label: '2 - High', value: '2' },
      { label: '3 - Medium', value: '3' },
      { label: '4 - Low', value: '4' },
    ],
    STATE_OPTIONS: [
      { label: 'All States', value: '' },
      { label: 'Open', value: 'OPEN' },
      { label: 'Closed', value: 'CLOSED' },
    ],
  },
} as const;

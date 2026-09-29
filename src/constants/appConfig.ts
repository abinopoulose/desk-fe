export const APP_CONFIG = {
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
  }
} as const;

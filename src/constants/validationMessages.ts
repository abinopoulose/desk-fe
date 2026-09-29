export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
  PASSWORD_MISMATCH: 'Passwords do not match',
  FIELD_TOO_SHORT: (min: number) => `Must be at least ${min} characters`,
  FIELD_TOO_LONG: (max: number) => `Cannot exceed ${max} characters`,
  INVALID_NUMBER: 'Please enter a valid number',
  POSITIVE_NUMBER_REQUIRED: 'Value must be greater than 0',
} as const;

export const NOTIFICATION_MESSAGES = {
  SUCCESS_SAVE: 'Changes saved successfully',
  SUCCESS_CREATE: 'Created successfully',
  SUCCESS_DELETE: 'Deleted successfully',
  SUCCESS_UPDATE: 'Updated successfully',
  ERROR_GENERIC: 'An error occurred. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
} as const;

import { VALIDATION_MESSAGES } from '../constants/validationMessages';

export type Validator = (value: any) => string | null;

export const required = (value: any): string | null => {
  if (value === undefined || value === null || value === '') {
    return VALIDATION_MESSAGES.REQUIRED;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return VALIDATION_MESSAGES.REQUIRED;
  }
  return null;
};

export const minLength = (min: number): Validator => (value: any): string | null => {
  if (value !== undefined && value !== null && value !== '') {
    if (typeof value === 'string' && value.length < min) {
      return VALIDATION_MESSAGES.FIELD_TOO_SHORT(min);
    }
  }
  return null;
};

export const maxLength = (max: number): Validator => (value: any): string | null => {
  if (value !== undefined && value !== null && value !== '') {
    if (typeof value === 'string' && value.length > max) {
      return VALIDATION_MESSAGES.FIELD_TOO_LONG(max);
    }
  }
  return null;
};

export const email = (value: any): string | null => {
  if (value !== undefined && value !== null && value !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value !== 'string' || !emailRegex.test(value)) {
      return VALIDATION_MESSAGES.EMAIL_INVALID;
    }
  }
  return null;
};

export interface PasswordRules {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}

export const password = (rules: PasswordRules = {}): Validator => (value: any): string | null => {
  if (value === undefined || value === null || value === '') return null;
  
  if (typeof value !== 'string') return VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH;

  if (rules.minLength && value.length < rules.minLength) {
    return VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH;
  }
  if (rules.requireUppercase && !/[A-Z]/.test(value)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (rules.requireLowercase && !/[a-z]/.test(value)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (rules.requireNumber && !/[0-9]/.test(value)) {
    return 'Password must contain at least one number';
  }
  if (rules.requireSpecial && !/[^A-Za-z0-9]/.test(value)) {
    return 'Password must contain at least one special character';
  }
  
  return null;
};

export const positiveInteger = (value: any): string | null => {
  if (value !== undefined && value !== null && value !== '') {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      return VALIDATION_MESSAGES.POSITIVE_NUMBER_REQUIRED;
    }
  }
  return null;
};

export const matchesField = (otherValue: any): Validator => (value: any): string | null => {
  if (value !== otherValue) {
    return VALIDATION_MESSAGES.PASSWORD_MISMATCH;
  }
  return null;
};

export const composeValidators = (...validators: Validator[]): Validator => (value: any): string | null => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  return null;
};

// Additional helpers for DynamicFormRenderer
export const minValue = (min: number): Validator => (value: any): string | null => {
  if (value !== undefined && value !== null && value !== '') {
    const num = Number(value);
    if (num < min) {
      return `Minimum value is ${min}`;
    }
  }
  return null;
};

export const maxValue = (max: number): Validator => (value: any): string | null => {
  if (value !== undefined && value !== null && value !== '') {
    const num = Number(value);
    if (num > max) {
      return `Maximum value is ${max}`;
    }
  }
  return null;
};

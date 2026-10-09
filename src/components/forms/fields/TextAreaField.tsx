import React from 'react';
import type { FieldProps } from './types';
import { TextField as MuiTextField, useMediaQuery, useTheme } from '@mui/material';

export const TextAreaField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentLength = typeof value === 'string' ? value.length : 0;
  
  return (
    <MuiTextField
      id={field.name}
      name={field.name}
      label={field.label}
      required={field.required}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error || (field.maxLength ? `${currentLength} / ${field.maxLength} characters` : '')}
      fullWidth
      multiline
      minRows={3}
      maxRows={8}
      size={isMobile ? 'medium' : 'small'}
    />
  );
};

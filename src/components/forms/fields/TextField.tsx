import React from 'react';
import type { FieldProps } from './types';
import { TextField as MuiTextField, useMediaQuery, useTheme } from '@mui/material';

export const TextField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <MuiTextField
      id={field.name}
      name={field.name}
      label={field.label}
      required={field.required}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error}
      fullWidth
      size={isMobile ? 'medium' : 'small'}
    />
  );
};

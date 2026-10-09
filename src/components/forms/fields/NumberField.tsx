import React from 'react';
import type { FieldProps } from './types';
import { TextField as MuiTextField, useMediaQuery, useTheme } from '@mui/material';

export const NumberField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <MuiTextField
      id={field.name}
      name={field.name}
      label={field.label}
      type="number"
      required={field.required}
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value === '' ? '' : Number(e.target.value);
        onChange(val);
      }}
      error={!!error}
      helperText={error}
      fullWidth
      size={isMobile ? 'medium' : 'small'}
      slotProps={{
        htmlInput: {
          min: field.min,
          max: field.max,
        }
      }}
    />
  );
};

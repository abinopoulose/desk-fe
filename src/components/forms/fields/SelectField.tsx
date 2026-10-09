import React from 'react';
import type { FieldProps } from './types';
import { Autocomplete, TextField, MenuItem, useMediaQuery, useTheme } from '@mui/material';

export const SelectField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const options = field.options || [];

  if (options.length > 5) {
    return (
      <Autocomplete
        id={field.name}
        options={options}
        value={value || null}
        onChange={(_, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            name={field.name}
            label={field.label}
            required={field.required}
            error={!!error}
            helperText={error}
            size={isMobile ? 'medium' : 'small'}
          />
        )}
      />
    );
  }

  return (
    <TextField
      id={field.name}
      name={field.name}
      label={field.label}
      select
      required={field.required}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error}
      fullWidth
      size={isMobile ? 'medium' : 'small'}
    >
      <MenuItem value="">
        <em>Select an option</em>
      </MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
    </TextField>
  );
};

import React from 'react';
import type { FieldProps } from './types';
import { FormControlLabel, Checkbox, FormControl, FormHelperText } from '@mui/material';

export const CheckboxField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  return (
    <FormControl error={!!error} component="fieldset">
      <FormControlLabel
        control={
          <Checkbox
            id={field.name}
            name={field.name}
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            color="primary"
          />
        }
        label={field.required ? `${field.label} *` : field.label}
      />
      {error && (
        <FormHelperText id={`${field.name}-helper`}>
          {error}
        </FormHelperText>
      )}
    </FormControl>
  );
};

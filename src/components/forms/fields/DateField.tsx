import React from 'react';
import type { FieldProps } from './types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useMediaQuery, useTheme } from '@mui/material';

export const DateField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={field.label}
        value={value ? dayjs(value as string) : null}
        onChange={(newValue) => {
          onChange(newValue ? newValue.format('YYYY-MM-DD') : '');
        }}
        slotProps={{
          textField: {
            id: field.name,
            name: field.name,
            required: field.required,
            error: !!error,
            helperText: error,
            fullWidth: true,
            size: isMobile ? 'medium' : 'small',
          },
        }}
      />
    </LocalizationProvider>
  );
};

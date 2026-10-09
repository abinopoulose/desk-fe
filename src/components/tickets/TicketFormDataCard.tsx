import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { EmptyState } from '../common/EmptyState';
import { ListAlt as ListAltIcon } from '@mui/icons-material';

export interface TicketFormDataCardProps {
  formData?: Record<string, unknown>;
}

/** Convert snake_case / camelCase keys to "Title Case" labels */
const humanizeKey = (key: string): string =>
  key
    .replace(/([A-Z])/g, ' $1')   // camelCase → spaced
    .replace(/[_-]+/g, ' ')       // snake_case / kebab → spaced
    .replace(/\b\w/g, (c) => c.toUpperCase()) // capitalise each word
    .trim();

export const TicketFormDataCard: React.FC<TicketFormDataCardProps> = ({ formData = {} }) => {
  const entries = Object.entries(formData);

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
        Ticket Details
      </Typography>

      {entries.length === 0 ? (
        <EmptyState
          icon={<ListAltIcon />}
          title="No form data provided"
          description="This ticket does not have any custom form fields."
        />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          {entries.map(([key, value]) => (
            <Box key={key}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {humanizeKey(key)}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {typeof value === 'boolean' ? (
                  <Chip
                    size="small"
                    label={value ? 'Yes' : 'No'}
                    color={value ? 'success' : 'error'}
                    variant="outlined"
                  />
                ) : Array.isArray(value) ? (
                  <ul className="list-disc pl-5">
                    {value.map((v, i) => (
                      <li key={i}>
                        <Typography variant="body2">{String(v)}</Typography>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Typography variant="body2">{String(value) || '–'}</Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

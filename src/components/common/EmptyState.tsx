import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  icon?: React.ReactElement<SvgIconProps>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 4,
        width: '100%',
        minHeight: 240,
        height: '100%',
      }}
      role="status"
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'action.disabled', display: 'flex' }}>
          {React.cloneElement(icon, { sx: { fontSize: 64, color: 'inherit', ...icon.props.sx } })}
        </Box>
      )}
      <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 3 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" color="primary" onClick={action.onClick} sx={{ mt: 1 }}>
          {action.label}
        </Button>
      )}
    </Box>
  );
};

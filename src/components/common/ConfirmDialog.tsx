import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';
import { motion, useReducedMotion } from 'framer-motion';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'danger' | 'warning';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  severity = 'danger',
  loading = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

    return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <motion.div initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <DialogTitle id="confirm-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {severity === 'danger' && <WarningAmberIcon color="error" />}
        {severity === 'warning' && <WarningAmberIcon color="warning" />}
        {title}
      </DialogTitle>
      <DialogContent>
        <Box id="confirm-dialog-description" sx={{ pt: 1 }}>
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" autoFocus>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={severity === 'danger' ? 'error' : 'warning'}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
      </motion.div>
    </Dialog>
  );
};

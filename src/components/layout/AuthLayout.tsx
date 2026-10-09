import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
        p: 2,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 440 }}
        >
          <Paper
            elevation={6}
            sx={{
              p: { xs: 4, sm: 6 },
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                mb: 3,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'inline-flex',
              }}
            >
              <ShieldCheck size={32} color="white" />
            </Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }} gutterBottom align="center">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                {subtitle}
              </Typography>
            )}
            
            <Box sx={{ width: '100%' }}>
              {children}
            </Box>
          </Paper>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '../../constants';
import { LogoIcon } from '../common/Logo';

export function AuthLayout({
  children,
  title,
  subtitle,
  maxWidth = 480,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  maxWidth?: number;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc', // slate-50
        background: 'radial-gradient(circle at 50% 0%, #eef2ff 0%, #f8fafc 70%)',
        p: { xs: 2, sm: 4 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow accents */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          bgcolor: 'rgba(99, 102, 241, 0.08)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          bgcolor: 'rgba(59, 130, 246, 0.06)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
          style={{ width: '100%', maxWidth, position: 'relative', zIndex: 10 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3.5, sm: 5 },
              borderRadius: 3.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0', // slate-200
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
            }}
          >
            {/* Logo Badge */}
            <Box
              sx={{
                mb: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <LogoIcon size={46} badge={true} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" component="span" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {APP_NAME}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      color: '#4f46e5',
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    Cloud
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 700, color: '#0f172a', mb: 1, letterSpacing: '-0.01em' }}
              align="center"
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{ color: '#64748b', mb: 3.5 }}
                align="center"
              >
                {subtitle}
              </Typography>
            )}

            <Box sx={{ width: '100%' }}>{children}</Box>
          </Paper>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}

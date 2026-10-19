import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '../../constants';

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
        bgcolor: '#020617', // slate-950
        p: { xs: 2, sm: 4 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          bgcolor: 'rgba(99, 102, 241, 0.15)',
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
          bgcolor: 'rgba(59, 130, 246, 0.12)',
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
            elevation={12}
            sx={{
              p: { xs: 3.5, sm: 5 },
              borderRadius: 3.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'rgba(15, 23, 42, 0.92)', // slate-900 with subtle transparency
              border: '1px solid rgba(51, 65, 85, 0.8)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.4)',
                  border: '1px solid rgba(129, 140, 248, 0.3)',
                }}
              >
                <Layers size={24} color="white" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" component="span" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                    {APP_NAME}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      bgcolor: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      border: '1px solid rgba(99, 102, 241, 0.3)',
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
              sx={{ fontWeight: 700, color: 'white', mb: 1, letterSpacing: '-0.01em' }}
              align="center"
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{ color: '#94a3b8', mb: 3.5 }}
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

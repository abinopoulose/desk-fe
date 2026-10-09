import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Box, Typography, Button } from '@mui/material';
import { SearchOff as SearchOffIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../store/authStore';
import { ROUTES } from '../../constants';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.title = '404 - Page Not Found';
  }, []);

  const handleAction = () => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    } else {
      navigate(ROUTES.AUTH.LOGIN);
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: isAuthenticated ? 'calc(100vh - 120px)' : '100vh',
        textAlign: 'center',
        p: 3,
        bgcolor: isAuthenticated ? 'transparent' : 'background.default',
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.50',
          p: 3,
          borderRadius: '50%',
          mb: 3,
        }}
      >
        <SearchOffIcon sx={{ fontSize: 64, color: 'primary.main' }} />
      </Box>

      <Typography variant="h1" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, fontSize: { xs: '4rem', md: '6rem' } }}>
        404
      </Typography>

      <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
        Page not found
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400, mb: 4, mx: 'auto' }}>
        The page you're looking for ({location.pathname}) doesn't exist or has been moved.
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={handleAction}
        sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1.5 }}
      >
        {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
      </Button>
    </Box>
  );
};

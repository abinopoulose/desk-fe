import React from 'react';
import { Skeleton, Box, Card, CardContent, Stack } from '@mui/material';

export const DataGridSkeleton: React.FC<{ rows?: number, columns?: number }> = ({ rows = 5, columns = 4 }) => {
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, px: 2 }}>
        {Array.from(new Array(columns)).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={32} sx={{ flex: 1, borderRadius: 1 }} animation="wave" />
        ))}
      </Box>
      <Stack spacing={1}>
        {Array.from(new Array(rows)).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, px: 2 }}>
            {Array.from(new Array(columns)).map((_, j) => (
              <Skeleton key={j} variant="text" height={40} sx={{ flex: 1 }} animation="wave" />
            ))}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <Card sx={{ height: '100%', minHeight: 120 }}>
      <CardContent>
        <Skeleton variant="text" width="40%" height={24} animation="wave" sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="80%" height={48} animation="wave" sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="text" width="60%" height={16} animation="wave" />
      </CardContent>
    </Card>
  );
};

export const PageHeaderSkeleton: React.FC = () => (
  <Box sx={{ mb: 4 }}>
    <Skeleton variant="text" width={200} height={40} animation="wave" />
    <Skeleton variant="text" width={300} height={20} animation="wave" />
  </Box>
);

export const FolderTreeSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <Stack spacing={2} sx={{ p: 2 }}>
    {Array.from(new Array(count)).map((_, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: i % 2 === 0 ? 0 : 2 }}>
        <Skeleton variant="circular" width={20} height={20} animation="wave" />
        <Skeleton variant="text" width={100 + ((i % 5) * 20)} animation="wave" />
      </Box>
    ))}
  </Stack>
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="30%" height={32} animation="wave" sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={height} animation="wave" sx={{ borderRadius: 1 }} />
    </CardContent>
  </Card>
);

export const OrgChartSkeleton: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, mt: 4 }}>
    <Skeleton variant="rectangular" width={200} height={80} animation="wave" sx={{ borderRadius: 2 }} />
    <Box sx={{ display: 'flex', gap: 4 }}>
      <Skeleton variant="rectangular" width={200} height={80} animation="wave" sx={{ borderRadius: 2 }} />
      <Skeleton variant="rectangular" width={200} height={80} animation="wave" sx={{ borderRadius: 2 }} />
    </Box>
  </Box>
);

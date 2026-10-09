import { CardSkeleton, ChartSkeleton } from '../../components/common/Skeletons';
import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { departmentApi } from '../../api/departmentApi';
import { useMetrics } from '../../hooks/useMetrics';
import { CHART_PALETTE } from '../../theme/tokens';
import { SectionErrorBoundary } from '../../components/errors/SectionErrorBoundary';

import {
  Box, Typography, Card, CardContent, Grid,
  ToggleButton, ToggleButtonGroup, FormControl, Select, MenuItem,
  IconButton, Tooltip as MuiTooltip
} from '@mui/material';
import {
  ConfirmationNumber as TicketIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface Department {
  id: string;
  name: string;
}

export const MetricsDashboardPage: React.FC = () => {
  const { metrics, chartData, loading, error, filters, setFilter, refetch } = useMetrics({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dateRange, setDateRange] = useState<string>('30d');

  useEffect(() => {
    departmentApi.getAllDepartments()
      .then(res => {
        if (Array.isArray(res)) setDepartments(res);
      })
      .catch(() => {});
  }, []);

  const handleDateRangeChange = (_: React.MouseEvent<HTMLElement>, newRange: string | null) => {
    if (!newRange) return;
    setDateRange(newRange);
    
    const now = new Date();
    let start = '';
    const end = '';
    
    if (newRange === '7d') {
      now.setDate(now.getDate() - 7);
      start = now.toISOString();
    } else if (newRange === '30d') {
      now.setDate(now.getDate() - 30);
      start = now.toISOString();
    } else if (newRange === '90d') {
      now.setDate(now.getDate() - 90);
      start = now.toISOString();
    }

    setFilter('startDate', start);
    setFilter('endDate', end);
  };

  const renderTrend = (value: number, isGoodPositive: boolean = true) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    const isGood = isPositive === isGoodPositive;
    const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
    const color = isGood ? 'success.main' : 'error.main';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color, mt: 1 }}>
        <Icon fontSize="small" />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {isPositive ? '+' : ''}{value}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          vs last period
        </Typography>
      </Box>
    );
  };

  const renderSummaryCards = () => {
    if (!metrics) return null;

    const cards = [
      {
        title: 'Total Tickets',
        value: metrics.totalTickets,
        icon: <TicketIcon sx={{ color: 'primary.main', fontSize: 32 }} />,
        trend: 12,
        trendGood: true,
        bgColor: 'primary.50'
      },
      {
        title: 'Open Tickets',
        value: metrics.openTickets,
        icon: <PendingIcon sx={{ color: 'warning.main', fontSize: 32 }} />,
        trend: -5,
        trendGood: false,
        bgColor: 'warning.50'
      },
      {
        title: 'Closed Tickets',
        value: metrics.closedTickets,
        icon: <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />,
        trend: 8,
        trendGood: true,
        bgColor: 'success.50'
      },
      {
        title: 'SLA Breach Rate',
        value: `${metrics.slaBreachRate.toFixed(1)}%`,
        icon: <WarningIcon sx={{ color: 'error.main', fontSize: 32 }} />,
        trend: -2.1,
        trendGood: false,
        bgColor: 'error.50',
        valueColor: metrics.slaBreachRate > 10 ? 'error.main' : 'success.main'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: card.bgColor }}>
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: card.valueColor || 'text.primary' }}>
                  {card.value}
                </Typography>
                {renderTrend(card.trend, card.trendGood)}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const downloadCsv = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const csvContent = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${row[k] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ChartHeader = ({ title, data, filename }: { title: string, data: any[], filename: string }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>{title}</Typography>
      <MuiTooltip title="Download CSV">
        <IconButton size="small" onClick={() => downloadCsv(data, filename)}>
          <DownloadIcon fontSize="small" />
        </IconButton>
      </MuiTooltip>
    </Box>
  );

  const renderCharts = () => {
    if (!metrics || !chartData) return null;

    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionErrorBoundary sectionName="Ticket Volume Trend">
            <Card variant="outlined" sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
              <ChartHeader title="Ticket Volume Trend" data={metrics.trend} filename="volume_trend.csv" />
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#9e9e9e" />
                    <YAxis tick={{fontSize: 12}} stroke="#9e9e9e" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke={CHART_PALETTE[0]} strokeWidth={3} dot={false} name="Created" activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="closed" stroke={CHART_PALETTE[1]} strokeWidth={3} dot={false} name="Closed" activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </SectionErrorBoundary>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionErrorBoundary sectionName="Priority Distribution">
            <Card variant="outlined" sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
              <ChartHeader title="Priority Distribution" data={metrics.byPriority} filename="priority_dist.csv" />
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.byPriority}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="priority"
                      label={(props: any) => `P${props.priority} ${((props.percent || 0) * 100).toFixed(0)}%`}
                    >
                      {metrics.byPriority.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </SectionErrorBoundary>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionErrorBoundary sectionName="Volume by Department">
            <Card variant="outlined" sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
              <ChartHeader title="Volume by Department" data={metrics.byDepartment} filename="department_volume.csv" />
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.byDepartment} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                    <XAxis type="number" stroke="#9e9e9e" />
                    <YAxis dataKey="departmentName" type="category" tick={{fontSize: 12}} width={100} stroke="#9e9e9e" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: 'rgba(0,0,0,0.04)'}} />
                    <Bar dataKey="count" fill={CHART_PALETTE[0]} name="Tickets" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </SectionErrorBoundary>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionErrorBoundary sectionName="SLA Compliance">
            <Card variant="outlined" sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
              <ChartHeader title="SLA Compliance" data={chartData.slaData} filename="sla_compliance.csv" />
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {metrics.totalTickets > 0 ? (
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={chartData.slaData}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={100}
                        outerRadius={140}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        <Cell fill={CHART_PALETTE[1]} />
                        <Cell fill={CHART_PALETTE[3]} />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">No data available</Typography>
                )}
                {metrics.averageTatHours !== null && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">Average Turnaround Time</Typography>
                    <Typography variant="h5" color="text.primary" sx={{ fontWeight: 600 }}>{metrics.averageTatHours} hours</Typography>
                  </Box>
                )}
              </Box>
            </Card>
          </SectionErrorBoundary>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 3, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Performance Metrics</Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', bgcolor: 'background.paper', p: 1, borderRadius: 2, boxShadow: 1 }}>
          <ToggleButtonGroup
            value={dateRange}
            exclusive
            onChange={handleDateRangeChange}
            size="small"
            aria-label="date range"
          >
            <ToggleButton value="7d" aria-label="last 7 days">7D</ToggleButton>
            <ToggleButton value="30d" aria-label="last 30 days">30D</ToggleButton>
            <ToggleButton value="90d" aria-label="last 90 days">90D</ToggleButton>
            <ToggleButton value="all" aria-label="all time">All</ToggleButton>
          </ToggleButtonGroup>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={filters.departmentId || ''}
              onChange={(e) => setFilter('departmentId', e.target.value)}
              displayEmpty
            >
              <MenuItem value=""><em>All Departments</em></MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Box sx={{ bgcolor: 'error.50', color: 'error.main', p: 2, borderRadius: 2, mb: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Typography>{error}</Typography>
          <Typography component="span" sx={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }} onClick={() => refetch()}>
            Retry
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[1, 2, 3, 4].map(i => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <CardSkeleton />
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map(i => (
              <Grid size={{ xs: 12, md: 6 }} key={i}>
                <ChartSkeleton height={400} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Box>
          {renderSummaryCards()}
          {renderCharts()}
        </Box>
      )}
    </Box>
  );
};

export default MetricsDashboardPage;

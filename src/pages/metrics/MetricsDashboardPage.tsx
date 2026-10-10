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
  BarChart3,
  Ticket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  RotateCcw,
  Building2,
  ChevronDown,
  Timer,
  AlertCircle
} from 'lucide-react';

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

  const handleDateRangeChange = (newRange: string) => {
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

  const ChartHeader = ({ title, data, filename }: { title: string; data: any[]; filename: string }) => (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <button
        type="button"
        onClick={() => downloadCsv(data, filename)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
        title="Download CSV"
      >
        <Download className="w-3.5 h-3.5 text-slate-400" />
        <span>CSV</span>
      </button>
    </div>
  );

  const renderTrend = (value: number, isGoodPositive: boolean = true) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    const isGood = isPositive === isGoodPositive;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const textColor = isGood ? 'text-emerald-700' : 'text-rose-700';
    const bgColor = isGood ? 'bg-emerald-50' : 'bg-rose-50';
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold ${textColor} ${bgColor}`}>
        <Icon className="w-3 h-3" />
        <span>{isPositive ? '+' : ''}{value}%</span>
        <span className="text-slate-400 font-normal">vs last period</span>
      </div>
    );
  };

  const renderSummaryCards = () => {
    if (!metrics) return null;

    const cards = [
      {
        title: 'Total Tickets',
        value: metrics.totalTickets,
        icon: Ticket,
        iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        trend: 12,
        trendGood: true,
      },
      {
        title: 'Open Tickets',
        value: metrics.openTickets,
        icon: Clock,
        iconColor: 'text-amber-600 bg-amber-50 border-amber-100',
        trend: -5,
        trendGood: false,
      },
      {
        title: 'Closed Tickets',
        value: metrics.closedTickets,
        icon: CheckCircle2,
        iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        trend: 8,
        trendGood: true,
      },
      {
        title: 'SLA Breach Rate',
        value: `${metrics.slaBreachRate.toFixed(1)}%`,
        icon: AlertTriangle,
        iconColor: metrics.slaBreachRate > 10
          ? 'text-rose-600 bg-rose-50 border-rose-100'
          : 'text-emerald-600 bg-emerald-50 border-emerald-100',
        trend: -2.1,
        trendGood: false,
        valueColor: metrics.slaBreachRate > 10 ? 'text-rose-600' : 'text-emerald-600',
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => {
          const IconComponent = card.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border flex items-center justify-center ${card.iconColor}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className={`text-2xl font-bold tracking-tight ${card.valueColor || 'text-slate-900'} mb-2`}>
                  {card.value}
                </div>
                {renderTrend(card.trend, card.trendGood)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCharts = () => {
    if (!metrics || !chartData) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Volume Trend */}
        <SectionErrorBoundary sectionName="Ticket Volume Trend">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 h-[420px] flex flex-col">
            <ChartHeader title="Ticket Volume Trend" data={metrics.trend} filename="volume_trend.csv" />
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.trend} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="created" stroke={CHART_PALETTE[0]} strokeWidth={2.5} dot={false} name="Created" activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="closed" stroke={CHART_PALETTE[1]} strokeWidth={2.5} dot={false} name="Closed" activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionErrorBoundary>

        {/* Priority Distribution */}
        <SectionErrorBoundary sectionName="Priority Distribution">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 h-[420px] flex flex-col">
            <ChartHeader title="Priority Distribution" data={metrics.byPriority} filename="priority_dist.csv" />
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.byPriority}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="priority"
                    label={(props: any) => `P${props.priority} ${((props.percent || 0) * 100).toFixed(0)}%`}
                  >
                    {metrics.byPriority.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionErrorBoundary>

        {/* Volume by Department */}
        <SectionErrorBoundary sectionName="Volume by Department">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 h-[420px] flex flex-col">
            <ChartHeader title="Volume by Department" data={metrics.byDepartment} filename="department_volume.csv" />
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.byDepartment} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="departmentName" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={90} stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '0.75rem',
                    }}
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="count" fill={CHART_PALETTE[0]} name="Tickets" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionErrorBoundary>

        {/* SLA Compliance */}
        <SectionErrorBoundary sectionName="SLA Compliance">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 h-[420px] flex flex-col">
            <ChartHeader title="SLA Compliance & Turnaround" data={chartData.slaData} filename="sla_compliance.csv" />
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
              {metrics.totalTickets > 0 ? (
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Pie
                      data={chartData.slaData}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      <Cell fill={CHART_PALETTE[1]} />
                      <Cell fill={CHART_PALETTE[3]} />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '0.75rem',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400 py-12">No SLA compliance data available</p>
              )}
              {metrics.averageTatHours !== null && (
                <div className="mt-2 text-center flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl w-full max-w-xs">
                  <Timer className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-2xs text-slate-500 font-medium">Average Turnaround Time</p>
                    <p className="text-sm font-bold text-slate-900">{metrics.averageTatHours} hours</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SectionErrorBoundary>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      {/* Top Header Card */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-6 lg:px-10 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <BarChart3 className="w-3.5 h-3.5" />
                Operations Analytics
              </span>
              <span className="text-xs text-slate-400 font-medium">Live Telemetry</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Performance Metrics</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of ticket resolution volume, SLA compliance rates, and team operational health.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date range segmented control */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: 'all', label: 'All' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleDateRangeChange(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dateRange === tab.id
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Department filter */}
            <div className="relative">
              <select
                value={filters.departmentId || ''}
                onChange={(e) => setFilter('departmentId', e.target.value)}
                className="appearance-none pl-8 pr-8 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 rounded-xl shadow-2xs transition-colors"
              title="Refresh metrics"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <ChartSkeleton key={i} height={400} />
              ))}
            </div>
          </div>
        ) : (
          <div>
            {renderSummaryCards()}
            {renderCharts()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsDashboardPage;

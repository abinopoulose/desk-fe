import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { CardSkeleton, ChartSkeleton } from '../../components/common/Skeletons';
import { SectionErrorBoundary } from '../../components/errors/SectionErrorBoundary';
import { departmentApi } from '../../api/departmentApi';
import { getOrgUsers } from '../../api/employeeApi';
import { useMetrics } from '../../hooks/useMetrics';
import { CHART_PALETTE } from '../../theme/tokens';
import type { User } from '../../types/user';
import type { AgentProductivityDTO } from '../../types/metrics';
import {
  BarChart3,
  Ticket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  RotateCcw,
  Building2,
  ChevronDown,
  Timer,
  AlertCircle,
  User as UserIcon,
  Users,
  Search,
  ArrowUpDown,
  Filter,
  Calendar,
  Zap,
  TrendingUp,
  ShieldAlert,
  Sliders,
  X
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

type ChartType = 'line' | 'area' | 'bar';
type MetricLens = 'velocity' | 'netChange' | 'tat';
type SortField = 'resolvedTickets' | 'assignedTickets' | 'resolutionRate' | 'averageTatHours' | 'slaBreachCount' | 'escalatedCount';
type SortOrder = 'asc' | 'desc';

export const MetricsDashboardPage: React.FC = () => {
  const { metrics, loading, error, filters, setFilter, setMultipleFilters, resetFilters, refetch } = useMetrics({
    interval: 'DAY',
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [datePreset, setDatePreset] = useState<string>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  
  // Chart visual customization
  const [chartType, setChartType] = useState<ChartType>('line');
  const [metricLens, setMetricLens] = useState<MetricLens>('velocity');

  // Specialist Leaderboard controls
  const [agentSearch, setAgentSearch] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('resolvedTickets');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Load departments and employee roster for filtering
  useEffect(() => {
    departmentApi.getAllDepartments()
      .then(res => {
        if (Array.isArray(res)) setDepartments(res);
      })
      .catch(() => {});

    getOrgUsers()
      .then(res => {
        if (Array.isArray(res)) setEmployees(res);
      })
      .catch(() => {});
  }, []);

  // Compute preset date intervals
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const end = now.toISOString();

    if (preset === 'custom') {
      return;
    }

    const start = new Date();
    if (preset === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (preset === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (preset === '14d') {
      start.setDate(now.getDate() - 14);
    } else if (preset === '30d') {
      start.setDate(now.getDate() - 30);
    } else if (preset === '90d') {
      start.setDate(now.getDate() - 90);
    } else if (preset === 'this_month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (preset === 'last_month') {
      start.setMonth(now.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      setMultipleFilters({
        startDate: start.toISOString(),
        endDate: lastMonthEnd.toISOString(),
      });
      return;
    } else if (preset === 'this_year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    }

    setMultipleFilters({
      startDate: start.toISOString(),
      endDate: end,
    });
  };

  const applyCustomDates = () => {
    if (!customStart || !customEnd) return;
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    setMultipleFilters({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  };

  const handleResetFilters = () => {
    setDatePreset('30d');
    setCustomStart('');
    setCustomEnd('');
    resetFilters();
  };

  const downloadCsv = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const csvContent = [
      keys.join(','),
      ...data.map(row => keys.map(k => {
        const val = row[k];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : `"${val ?? ''}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter and sort specialist leaderboard
  const sortedAgents = useMemo(() => {
    if (!metrics?.agentProductivity) return [];
    let list = [...metrics.agentProductivity];

    if (agentSearch.trim()) {
      const q = agentSearch.toLowerCase();
      list = list.filter(a =>
        a.assigneeName.toLowerCase().includes(q) ||
        a.assigneeEmail.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [metrics?.agentProductivity, agentSearch, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // KPI Calculations
  const openPercentage = metrics && metrics.totalTickets > 0
    ? ((metrics.openTickets / metrics.totalTickets) * 100).toFixed(0)
    : '0';
  const closedPercentage = metrics && metrics.totalTickets > 0
    ? ((metrics.closedTickets / metrics.totalTickets) * 100).toFixed(0)
    : '0';
  const complianceRate = metrics
    ? (100 - metrics.slaBreachRate).toFixed(1)
    : '100.0';

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-20">
      {/* Top Header Card */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 shadow-2xs">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <BarChart3 className="w-3.5 h-3.5" />
                Productivity & Operations Intelligence
              </span>
              <span className="text-xs text-slate-400 font-medium">Live Telemetry</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Performance Metrics</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive telemetry for fulfillment velocity, team throughput, backlog aging, and SLA compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Reset all filters to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Refresh metrics"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Customizable Control & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Customize Scope & Dimensions</span>
            </div>

            {/* Interval Aggregator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Interval:</span>
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['DAY', 'WEEK', 'MONTH'] as const).map((int) => (
                  <button
                    key={int}
                    type="button"
                    onClick={() => setFilter('interval', int)}
                    className={`px-2.5 py-1 text-2xs font-semibold rounded-md transition-all ${
                      (filters.interval || 'DAY') === int
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {int === 'DAY' ? 'Daily' : int === 'WEEK' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time Presets & Custom Pickers */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Time Range:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7D' },
              { id: '14d', label: '14D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handlePresetChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  datePreset === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Custom Date Pickers */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={applyCustomDates}
                  disabled={!customStart || !customEnd}
                  className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Dimension Dropdowns: Department, Specialist, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            {/* Department Filter */}
            <div className="relative">
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Department
              </label>
              <div className="relative">
                <select
                  value={filters.departmentId || ''}
                  onChange={(e) => setFilter('departmentId', e.target.value)}
                  className="w-full appearance-none pl-8 pr-8 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Specialist / Assignee Filter */}
            <div className="relative">
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Specialist / Assignee
              </label>
              <div className="relative">
                <select
                  value={filters.assigneeId || ''}
                  onChange={(e) => setFilter('assigneeId', e.target.value)}
                  className="w-full appearance-none pl-8 pr-8 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="">All Specialists</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.email})</option>
                  ))}
                </select>
                <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Priority Tier
              </label>
              <div className="relative">
                <select
                  value={filters.priority || ''}
                  onChange={(e) => setFilter('priority', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full appearance-none pl-8 pr-8 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="">All Priorities (P1 - P4)</option>
                  <option value="1">P1 - Critical</option>
                  <option value="2">P2 - High</option>
                  <option value="3">P3 - Medium</option>
                  <option value="4">P4 - Low</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(filters.departmentId || filters.assigneeId || filters.priority !== undefined) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Active Filters:</span>
              {filters.departmentId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Dept: {departments.find(d => d.id === filters.departmentId)?.name || filters.departmentId}
                  <button type="button" onClick={() => setFilter('departmentId', undefined)} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.assigneeId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Specialist: {employees.find(e => e.id === filters.assigneeId)?.fullName || filters.assigneeId}
                  <button type="button" onClick={() => setFilter('assigneeId', undefined)} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.priority !== undefined && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Priority: P{filters.priority}
                  <button type="button" onClick={() => setFilter('priority', undefined)} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-2xs font-semibold text-rose-600 hover:text-rose-800 underline ml-1 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
            </div>
            <ChartSkeleton height={420} />
            <ChartSkeleton height={320} />
          </div>
        ) : metrics ? (
          <>
            {/* KPI Executive Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Total Inflow */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Inflow</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{metrics.totalTickets}</div>
                  <p className="text-2xs text-slate-400 mt-1 font-medium">Total tickets submitted</p>
                </div>
              </div>

              {/* Active Backlog */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-bold text-amber-600 uppercase tracking-wider">Active Backlog</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-amber-600 tracking-tight">{metrics.openTickets}</div>
                  <p className="text-2xs text-slate-400 mt-1 font-medium">{openPercentage}% of inflow active</p>
                </div>
              </div>

              {/* Resolved Throughput */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-bold text-emerald-600 uppercase tracking-wider">Resolved Velocity</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">{metrics.closedTickets}</div>
                  <p className="text-2xs text-slate-400 mt-1 font-medium">{closedPercentage}% resolution rate</p>
                </div>
              </div>

              {/* MTTR / TAT */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-bold text-purple-600 uppercase tracking-wider">Avg Turnaround</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <Timer className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {metrics.averageTatHours !== null ? `${metrics.averageTatHours}h` : 'N/A'}
                  </div>
                  <p className="text-2xs text-slate-400 mt-1 font-medium">Mean resolution time</p>
                </div>
              </div>

              {/* SLA Compliance */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">SLA Compliance</span>
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                    metrics.slaBreachRate > 10 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-extrabold tracking-tight ${metrics.slaBreachRate > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {complianceRate}%
                  </div>
                  <p className="text-2xs text-slate-400 mt-1 font-medium">
                    {metrics.slaBreachCount} breached / {metrics.totalTickets} total
                  </p>
                </div>
              </div>

              {/* Escalated Tickets */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-bold text-rose-600 uppercase tracking-wider">Escalated</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
                    {metrics.escalatedCount ?? 0}
                  </div>
                  <p className="text-2xs text-slate-400 mt-1 font-medium">SLA breaches escalated</p>
                </div>
              </div>
            </div>

            {/* Actionable Productivity Insights Strip */}
            <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 rounded-2xl border border-indigo-100 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Productivity Diagnosis</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {metrics.closedTickets >= metrics.openTickets
                      ? `Positive operational throughput: team resolved ${metrics.closedTickets} tickets vs ${metrics.openTickets} in active queue.`
                      : `Backlog growing: ${metrics.openTickets} active requests pending vs ${metrics.closedTickets} resolved. Recommend triaging aging tickets.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className={`text-2xs font-bold px-2.5 py-1 rounded-full ${
                  parseFloat(complianceRate) >= 90
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  Current: {complianceRate}%
                </span>
              </div>
            </div>

            {/* Primary Velocity & Trend Chart (Highly Customizable) */}
            <SectionErrorBoundary sectionName="Fulfillment Velocity Chart">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      Fulfillment Velocity & Throughput Trend
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Track inflow velocity, resolution volume, and net queue trajectory over time.
                    </p>
                  </div>

                  {/* Chart Customization Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Metric Lens Toggle */}
                    <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setMetricLens('velocity')}
                        className={`px-2.5 py-1 text-2xs font-semibold rounded-md transition-all ${
                          metricLens === 'velocity'
                            ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Velocity
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetricLens('netChange')}
                        className={`px-2.5 py-1 text-2xs font-semibold rounded-md transition-all ${
                          metricLens === 'netChange'
                            ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Net Delta
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetricLens('tat')}
                        className={`px-2.5 py-1 text-2xs font-semibold rounded-md transition-all ${
                          metricLens === 'tat'
                            ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        TAT (Hrs)
                      </button>
                    </div>

                    {/* Chart Type Toggle */}
                    <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {(['line', 'area', 'bar'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setChartType(type)}
                          className={`px-2.5 py-1 text-2xs font-semibold rounded-md uppercase transition-all ${
                            chartType === type
                              ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Export CSV */}
                    <button
                      type="button"
                      onClick={() => downloadCsv(metrics.trend, 'velocity_trend.csv')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      title="Download trend CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                <div className="h-[360px] w-full">
                  {metrics.trend && metrics.trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {metricLens === 'netChange' ? (
                        <BarChart data={metrics.trend} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
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
                          <Bar dataKey="netDelta" fill={CHART_PALETTE[0]} name="Net Growth (Created - Closed)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : metricLens === 'tat' ? (
                        <LineChart data={metrics.trend} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" unit="h" />
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
                          <Line type="monotone" dataKey="averageTatHours" stroke="#8b5cf6" strokeWidth={2.5} dot={false} name="Avg TAT (Hours)" activeDot={{ r: 5 }} />
                        </LineChart>
                      ) : chartType === 'area' ? (
                        <AreaChart data={metrics.trend} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                          <defs>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_PALETTE[0]} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={CHART_PALETTE[0]} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_PALETTE[1]} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={CHART_PALETTE[1]} stopOpacity={0} />
                            </linearGradient>
                          </defs>
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
                          <Area type="monotone" dataKey="created" stroke={CHART_PALETTE[0]} fillOpacity={1} fill="url(#colorCreated)" name="Created" />
                          <Area type="monotone" dataKey="closed" stroke={CHART_PALETTE[1]} fillOpacity={1} fill="url(#colorClosed)" name="Closed" />
                        </AreaChart>
                      ) : chartType === 'bar' ? (
                        <BarChart data={metrics.trend} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
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
                          <Bar dataKey="created" fill={CHART_PALETTE[0]} name="Created" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="closed" fill={CHART_PALETTE[1]} name="Closed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
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
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-slate-400">No ticket volume trend data available for selected scope</p>
                    </div>
                  )}
                </div>
              </div>
            </SectionErrorBoundary>

            {/* Specialist Productivity Leaderboard & Backlog Aging */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Specialist Productivity Leaderboard (2 Cols) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Specialist Productivity Leaderboard
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Output throughput, resolution speed, and SLA accountability per specialist.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        placeholder="Search specialist..."
                        className="w-44 pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadCsv(metrics.agentProductivity || [], 'specialist_productivity.csv')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      title="Download specialist leaderboard CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-2xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-3">Specialist</th>
                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900"
                          onClick={() => toggleSort('assignedTickets')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Assigned</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900"
                          onClick={() => toggleSort('resolvedTickets')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Resolved</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900"
                          onClick={() => toggleSort('resolutionRate')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Resolution %</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900"
                          onClick={() => toggleSort('averageTatHours')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Avg TAT</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900"
                          onClick={() => toggleSort('slaBreachCount')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Breaches</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-900"
                          onClick={() => toggleSort('escalatedCount')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Escalated</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedAgents.length > 0 ? (
                        sortedAgents.map((agent: AgentProductivityDTO) => (
                          <tr key={agent.assigneeId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                {agent.profilePictureUrl ? (
                                  <img
                                    src={agent.profilePictureUrl}
                                    alt={agent.assigneeName}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                    {agent.assigneeName ? agent.assigneeName.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 truncate">{agent.assigneeName}</div>
                                  <div className="text-2xs text-slate-400 truncate">{agent.assigneeEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{agent.assignedTickets}</td>
                            <td className="py-3 px-3 font-bold text-emerald-600">{agent.resolvedTickets}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">{agent.resolutionRate}%</span>
                                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      agent.resolutionRate >= 80 ? 'bg-emerald-500' : agent.resolutionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, agent.resolutionRate))}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-700">
                              {agent.averageTatHours !== null ? `${agent.averageTatHours}h` : 'N/A'}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                                agent.slaBreachCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'
                              }`}>
                                {agent.slaBreachCount}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                                agent.escalatedCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'
                              }`}>
                                {agent.escalatedCount}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setFilter('assigneeId', agent.assigneeId)}
                                className="text-2xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                              >
                                Filter Scope
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                            No specialist productivity data available for current scope
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Backlog Aging & Queue Health Widget (1 Col) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Backlog Aging Distribution
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live breakdown of currently open tickets by elapsed duration.
                  </p>
                </div>

                {metrics.backlogAging && metrics.openTickets > 0 ? (
                  <div className="space-y-4">
                    {/* Visual Multi-Segment Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(metrics.backlogAging.lessThan24h / metrics.openTickets) * 100}%` }}
                        title={`< 24h: ${metrics.backlogAging.lessThan24h}`}
                      />
                      <div
                        className="bg-indigo-400 h-full"
                        style={{ width: `${(metrics.backlogAging.oneToThreeDays / metrics.openTickets) * 100}%` }}
                        title={`1-3d: ${metrics.backlogAging.oneToThreeDays}`}
                      />
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${(metrics.backlogAging.threeToSevenDays / metrics.openTickets) * 100}%` }}
                        title={`3-7d: ${metrics.backlogAging.threeToSevenDays}`}
                      />
                      <div
                        className="bg-orange-500 h-full"
                        style={{ width: `${(metrics.backlogAging.sevenToFourteenDays / metrics.openTickets) * 100}%` }}
                        title={`7-14d: ${metrics.backlogAging.sevenToFourteenDays}`}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${(metrics.backlogAging.moreThan14Days / metrics.openTickets) * 100}%` }}
                        title={`> 14d: ${metrics.backlogAging.moreThan14Days}`}
                      />
                    </div>

                    {/* Bucket Items */}
                    <div className="space-y-2.5">
                      {[
                        { label: '< 24 Hours', count: metrics.backlogAging.lessThan24h, color: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-50' },
                        { label: '1 - 3 Days', count: metrics.backlogAging.oneToThreeDays, color: 'bg-indigo-400', text: 'text-indigo-700 bg-indigo-50' },
                        { label: '3 - 7 Days', count: metrics.backlogAging.threeToSevenDays, color: 'bg-amber-400', text: 'text-amber-700 bg-amber-50' },
                        { label: '7 - 14 Days', count: metrics.backlogAging.sevenToFourteenDays, color: 'bg-orange-500', text: 'text-orange-700 bg-orange-50' },
                        { label: '> 14 Days (Stale)', count: metrics.backlogAging.moreThan14Days, color: 'bg-rose-500', text: 'text-rose-700 bg-rose-50' },
                      ].map(bucket => {
                        const pct = metrics.openTickets > 0
                          ? ((bucket.count / metrics.openTickets) * 100).toFixed(0)
                          : '0';
                        return (
                          <div key={bucket.label} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-none">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${bucket.color}`} />
                              <span className="font-medium text-slate-700">{bucket.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${bucket.text}`}>
                                {bucket.count} ({pct}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No active backlog tickets currently in queue
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-2xs text-slate-500">
                  <span className="font-bold text-slate-700">Triage Tip:</span> Tickets older than 7 days represent high SLA breach risk. Reassign or escalate to preserve service targets.
                </div>
              </div>
            </div>

            {/* Operational Breakdowns (Priority & Ticket Type Distribution) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Distribution */}
              <SectionErrorBoundary sectionName="Priority Breakdown">
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 h-[400px] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Priority Volume Breakdown</h3>
                      <p className="text-xs text-slate-500">Inflow distribution categorized by urgency level.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadCsv(metrics.byPriority, 'priority_distribution.csv')}
                      className="inline-flex items-center gap-1 px-2 py-1 text-2xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>CSV</span>
                    </button>
                  </div>

                  <div className="flex-1 min-h-0">
                    {metrics.byPriority && metrics.byPriority.some(p => p.count > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metrics.byPriority}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={105}
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
                          <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '5px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-slate-400">No priority data available for current scope</p>
                      </div>
                    )}
                  </div>
                </div>
              </SectionErrorBoundary>

              {/* Volume by Ticket Type */}
              <SectionErrorBoundary sectionName="Ticket Type Breakdown">
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 h-[400px] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Request Category & Type Breakdown</h3>
                      <p className="text-xs text-slate-500">Volume and average turnaround time per ticket type.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadCsv(metrics.byTicketType || [], 'ticket_type_breakdown.csv')}
                      className="inline-flex items-center gap-1 px-2 py-1 text-2xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>CSV</span>
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {metrics.byTicketType && metrics.byTicketType.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {metrics.byTicketType.map((tt) => {
                          const pct = metrics.totalTickets > 0
                            ? ((tt.count / metrics.totalTickets) * 100).toFixed(0)
                            : '0';
                          return (
                            <div key={tt.ticketTypeId} className="py-2.5 flex items-center justify-between text-xs">
                              <div className="min-w-0 pr-3">
                                <span className="font-semibold text-slate-900 block truncate">{tt.ticketTypeName}</span>
                                <span className="text-2xs text-slate-400">
                                  Avg Resolution: {tt.averageTatHours !== null ? `${tt.averageTatHours} hrs` : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-full rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(0, parseInt(pct, 10)))}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-700 w-12 text-right">
                                  {tt.count} ({pct}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-slate-400">No ticket category data available for current scope</p>
                      </div>
                    )}
                  </div>
                </div>
              </SectionErrorBoundary>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default MetricsDashboardPage;

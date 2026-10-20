import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Timer,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { departmentApi } from '../../api/departmentApi';
import { useAuth } from '../../store/authStore';
import { DepartmentHeaderNav } from './DepartmentHeaderNav';
import { ROUTES } from '../../constants';
import type {
  MyDepartmentDTO,
  DepartmentDTO,
  DepartmentMetricsDTO,
} from '../../types/department';

export const DepartmentMetricsPage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, hasPrivilege } = useAuth();
  const canEditAnyDept = isSuperAdmin || hasPrivilege('DEPARTMENT_EDIT');

  // Department state
  const [department, setDepartment] = useState<MyDepartmentDTO | DepartmentDTO | null>(null);
  const [myDepartments, setMyDepartments] = useState<MyDepartmentDTO[]>([]);
  const [myRole, setMyRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  const [loadingDept, setLoadingDept] = useState(true);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Metrics state
  const [metrics, setMetrics] = useState<DepartmentMetricsDTO | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch department details & user role
  const fetchDepartmentInfo = useCallback(async () => {
    if (!departmentId) return;
    setLoadingDept(true);
    setDeptError(null);
    try {
      const myDepts = await departmentApi.getMyDepartments();
      setMyDepartments(myDepts);
      const current = myDepts.find((d) => d.id === departmentId);
      if (current) {
        setDepartment(current);
        setMyRole(current.myRole);
      } else {
        const dept = await departmentApi.getDepartmentById(departmentId);
        setDepartment(dept);
        if (canEditAnyDept) {
          setMyRole('ADMIN');
        } else {
          setMyRole(null);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load department info', err);
      setDeptError('Failed to load department information.');
    } finally {
      setLoadingDept(false);
    }
  }, [departmentId, canEditAnyDept]);

  useEffect(() => {
    fetchDepartmentInfo();
  }, [fetchDepartmentInfo]);

  // Fetch department metrics
  const fetchMetrics = useCallback(async () => {
    if (!departmentId) return;
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const data = await departmentApi.getDepartmentMetrics(departmentId);
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      console.error('Failed to load department metrics', err);
      setMetricsError('Failed to load performance metrics for this department.');
    } finally {
      setLoadingMetrics(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const isCurrentDeptAdmin = canEditAnyDept || myRole === 'ADMIN';

  if (loadingDept) {
    return (
      <div className="min-h-full bg-slate-50 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Loading department...</span>
        </div>
      </div>
    );
  }

  if (deptError || !department) {
    return (
      <div className="min-h-full bg-slate-50 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-red-900">Department Not Found</h2>
          <p className="text-xs text-red-700 max-w-md mx-auto">
            {deptError || 'We could not locate this department.'}
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.DEPARTMENT_TICKETS)}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
          >
            Back to Department Tickets
          </button>
        </div>
      </div>
    );
  }

  // Admin access gate: Only department admins can view performance metrics
  if (!isCurrentDeptAdmin) {
    return (
      <div className="min-h-full bg-slate-50 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-amber-900">Admin Privileges Required</h2>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Only department administrators can view department performance metrics. You can view the tickets queue instead.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.DEPARTMENT_DETAILS.TICKETS(department.id))}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              View Department Tickets
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.DEPARTMENT_TICKETS)}
              className="px-4 py-2 bg-white text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Back to Department Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatHours = (minutes: number) => {
    if (!minutes || minutes <= 0) return '0 hrs';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hrs = (minutes / 60).toFixed(1);
    return `${hrs} hrs`;
  };

  const complianceRate = metrics ? Math.round(metrics.slaComplianceRate * 10) / 10 : 0;
  const openPercentage = metrics && metrics.totalTickets > 0 ? Math.round((metrics.openTickets / metrics.totalTickets) * 100) : 0;
  const closedPercentage = metrics && metrics.totalTickets > 0 ? Math.round((metrics.closedTickets / metrics.totalTickets) * 100) : 0;

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      {/* Shared Department Header Nav */}
      <DepartmentHeaderNav
        departmentId={department.id}
        departmentName={department.name}
        description={department.description}
        alphaTags={department.alphaTags}
        myRole={myRole}
        activeTab="metrics"
        isAdmin={true}
        myDepartments={myDepartments}
      />

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6">
        {/* Top Info Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Department Performance & SLA Overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time resolution velocity, fulfillment health, and SLA compliance metrics for {department.name}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              type="button"
              onClick={fetchMetrics}
              disabled={loadingMetrics}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMetrics ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metrics Error */}
        {metricsError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{metricsError}</span>
            </div>
            <button
              type="button"
              onClick={fetchMetrics}
              className="font-semibold underline hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loadingMetrics && !metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Metrics Cards Grid */}
        {metrics && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-6">
              {/* Total Tickets */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Inflow
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {metrics.totalTickets}
                </div>
                <p className="text-xs text-slate-400">
                  Total tickets routed to this department
                </p>
              </div>

              {/* Open Tickets */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    Active Queue
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
                  {metrics.openTickets}
                </div>
                <p className="text-xs text-slate-400">
                  Open requests awaiting fulfillment
                </p>
              </div>

              {/* Closed Tickets */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    Resolved & Closed
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {metrics.closedTickets}
                </div>
                <p className="text-xs text-slate-400">
                  Successfully completed requests
                </p>
              </div>

              {/* SLA Compliance Rate */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    SLA Compliance
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-extrabold tracking-tight ${
                      complianceRate >= 90
                        ? 'text-emerald-600'
                        : complianceRate >= 75
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  >
                    {complianceRate}%
                  </span>
                  <span className="text-xs font-medium text-slate-400">target &gt; 90%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      complianceRate >= 90
                        ? 'bg-emerald-500'
                        : complianceRate >= 75
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, complianceRate))}%` }}
                  />
                </div>
              </div>

              {/* SLA Breaches */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    SLA Breaches
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                      metrics.slaBreachedCount > 0
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className={`text-3xl font-extrabold tracking-tight ${
                    metrics.slaBreachedCount > 0 ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {metrics.slaBreachedCount}
                </div>
                <p className="text-xs text-slate-400">
                  {metrics.slaBreachedCount > 0
                    ? 'Tickets that exceeded SLA resolution target'
                    : 'Zero SLA breaches recorded'}
                </p>
              </div>

              {/* Avg Resolution Time */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Avg Resolution Time
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <Timer className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatHours(metrics.avgResolutionMinutes)}
                </div>
                <p className="text-xs text-slate-400">
                  Mean duration from creation to closure
                </p>
              </div>
            </div>

            {/* Health Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Queue Status Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Queue Health Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Completed vs Pending</span>
                    <span className="text-slate-900">
                      {metrics.closedTickets} / {metrics.totalTickets} resolved
                    </span>
                  </div>
                  {/* Visual Ratio Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${closedPercentage}%` }}
                      title={`Closed: ${metrics.closedTickets} (${closedPercentage}%)`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all duration-500"
                      style={{ width: `${openPercentage}%` }}
                      title={`Open: ${metrics.openTickets} (${openPercentage}%)`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Closed ({closedPercentage}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Open ({openPercentage}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Prompt Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-100 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">
                    Fulfill Pending Requests
                  </h3>
                  <p className="text-xs text-indigo-900/70 mt-1.5 leading-relaxed">
                    There are currently <strong>{metrics.openTickets}</strong> active tickets in {department.name}'s service queue.
                    Members can triage and take up open tickets immediately.
                  </p>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.DEPARTMENT_DETAILS.TICKETS(department.id))}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Go to Tickets Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

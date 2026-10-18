import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Inbox,
  UserPlus,
  Building2
} from 'lucide-react';
import { departmentApi } from '../../api/departmentApi';
import { ticketApi } from '../../api/ticketApi';
import { useAuth } from '../../store/authStore';
import { ROUTES } from '../../constants';
import { DepartmentHeaderNav } from './DepartmentHeaderNav';
import { getPriorityStyle, getTicketDisplayReference } from '../../utils/ticketUtils';
import { getUserInitial } from '../../utils/userUtils';
import type { MyDepartmentDTO, DepartmentDTO } from '../../types/department';
import type { TicketDTO, TicketFilterParams } from '../../types/ticket';

interface DepartmentViewItem {
  id: string;
  displayId?: string;
  name: string;
  description?: string;
  alphaTags?: string[];
  myRole?: 'ADMIN' | 'MEMBER' | null;
  memberCount?: number;
}

export const DepartmentTicketsPage: React.FC = () => {
  const { departmentId: paramDepartmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin, hasPrivilege } = useAuth();
  const canEditAnyDept = isSuperAdmin || hasPrivilege('DEPARTMENT_EDIT');

  // Department State
  const [department, setDepartment] = useState<DepartmentViewItem | null>(null);
  const [myDepartments, setMyDepartments] = useState<DepartmentViewItem[]>([]);
  const [activeDepartmentId, setActiveDepartmentId] = useState<string>(paramDepartmentId || '');
  const [myRole, setMyRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  const [loadingDept, setLoadingDept] = useState(true);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Filter State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mappedState, setMappedState] = useState<'' | 'OPEN' | 'CLOSED'>('');
  const [priority, setPriority] = useState<string>('');
  const [assigneeMode, setAssigneeMode] = useState<'all' | 'unassigned' | 'me'>('all');
  const [sort, setSort] = useState<string>('createdAt,desc');

  // Pagination State
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Take Ticket Action State
  const [takingTicketId, setTakingTicketId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (paramDepartmentId && paramDepartmentId !== activeDepartmentId) {
      setActiveDepartmentId(paramDepartmentId);
    }
  }, [paramDepartmentId]);

  // Fetch department details & user role
  const fetchDepartmentInfo = useCallback(async () => {
    setLoadingDept(true);
    setDeptError(null);
    try {
      const [myDepts, allDepts] = await Promise.all([
        departmentApi.getMyDepartments().catch(() => [] as MyDepartmentDTO[]),
        departmentApi.getAllDepartments().catch(() => [] as DepartmentDTO[]),
      ]);

      const safeMyDepts = Array.isArray(myDepts) ? myDepts : [];
      const safeAllDepts = Array.isArray(allDepts) ? allDepts : [];

      // Combine into available list for department switcher:
      // Include all organization departments and user's assigned departments
      const combinedDepts: Array<{ id: string; displayId?: string; name: string; description?: string; alphaTags?: string[] }> = [...safeAllDepts];
      for (const md of safeMyDepts) {
        if (!combinedDepts.some((d) => d.id === md.id)) {
          combinedDepts.push({
            id: md.id,
            displayId: (md as any).displayId,
            name: md.name,
            description: md.description,
            alphaTags: md.alphaTags,
          });
        }
      }

      const availableList: DepartmentViewItem[] = combinedDepts.map((d) => {
        const existing = safeMyDepts.find((m) => m.id === d.id);
        return {
          id: d.id,
          displayId: d.displayId,
          name: d.name,
          description: d.description,
          alphaTags: d.alphaTags,
          myRole: existing?.myRole || (canEditAnyDept ? ('ADMIN' as const) : null),
          memberCount: existing?.memberCount || 0,
        };
      });

      setMyDepartments(availableList);

      if (availableList.length === 0) {
        setDepartment(null);
        setActiveDepartmentId('');
        setLoadingDept(false);
        return;
      }

      // Determine target department:
      // Priority: param in URL -> previously active dept -> dept user belongs to -> first available dept
      const targetId = paramDepartmentId || activeDepartmentId;
      let current = targetId
        ? availableList.find((d) => d.id === targetId || d.displayId === targetId)
        : null;

      if (!current && targetId) {
        try {
          const direct = await departmentApi.getDepartmentById(targetId);
          current = {
            id: direct.id,
            displayId: direct.displayId,
            name: direct.name,
            description: direct.description,
            alphaTags: direct.alphaTags,
            myRole: canEditAnyDept ? ('ADMIN' as const) : null,
            memberCount: 0,
          };
        } catch {
          // not found by direct id
        }
      }

      if (!current) {
        current = availableList.find((d) => d.myRole !== null) || availableList[0];
      }

      setDepartment(current);
      setActiveDepartmentId(current.id);
      setMyRole(current.myRole || (canEditAnyDept ? 'ADMIN' : null));
    } catch (err: unknown) {
      console.error('Failed to load department info', err);
      setDeptError('Failed to load department information.');
    } finally {
      setLoadingDept(false);
    }
  }, [paramDepartmentId, canEditAnyDept]);

  useEffect(() => {
    fetchDepartmentInfo();
  }, [fetchDepartmentInfo]);

  // Fetch tickets for this department
  const fetchTickets = useCallback(async () => {
    if (!activeDepartmentId) return;
    setLoadingTickets(true);
    setTicketsError(null);
    try {
      const params: TicketFilterParams = {
        departmentId: activeDepartmentId,
        page,
        size,
        sort,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (mappedState) {
        params.mappedState = mappedState;
      }
      if (priority) {
        params.priority = Number(priority);
      }
      if (assigneeMode === 'unassigned') {
        params.unassigned = true;
      } else if (assigneeMode === 'me' && user?.id) {
        params.assigneeId = user.id;
      }

      const res = await ticketApi.getTickets(params);
      if (isMountedRef.current) {
        setTickets(res.tickets || []);
        setTotalElements(res.totalElements || 0);
        setTotalPages(res.totalPages || 0);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        console.error('Failed to fetch department tickets', err);
        setTicketsError('Failed to load tickets for this department.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingTickets(false);
      }
    }
  }, [activeDepartmentId, debouncedSearch, mappedState, priority, assigneeMode, sort, page, size, user?.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handle "Take Ticket" (assign to me)
  const handleTakeTicket = async (ticket: TicketDTO) => {
    if (!user?.id) return;
    setTakingTicketId(ticket.id);
    setActionSuccessMessage(null);
    try {
      await ticketApi.assignTicket(ticket.id, user.id);
      setActionSuccessMessage(`Ticket #${ticket.displayId || ticket.id.substring(0, 8).toUpperCase()} assigned to you.`);
      // Refetch tickets
      await fetchTickets();
      setTimeout(() => {
        if (isMountedRef.current) {
          setActionSuccessMessage(null);
        }
      }, 4000);
    } catch (err: unknown) {
      console.error('Failed to assign ticket', err);
      alert('Failed to assign ticket to yourself. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setTakingTicketId(null);
      }
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(mappedState) ||
    Boolean(priority) ||
    assigneeMode !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setMappedState('');
    setPriority('');
    setAssigneeMode('all');
    setPage(0);
  };

  if (loadingDept) {
    return (
      <div className="min-h-full bg-slate-50 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Loading department tickets...</span>
        </div>
      </div>
    );
  }

  if (deptError || !department) {
    return (
      <div className="min-h-full bg-slate-50 max-w-7xl mx-auto px-6 py-12">
        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-xs max-w-lg mx-auto">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Departments Available</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {deptError || 'There are no departments created in your organization yet.'}
          </p>
          {canEditAnyDept ? (
            <button
              type="button"
              onClick={() => navigate(ROUTES.ADMIN.DEPARTMENTS)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Manage Departments
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      {/* Shared Department Header Nav */}
      <DepartmentHeaderNav
        departmentId={department.id}
        departmentName={department.name}
        description={department.description}
        alphaTags={department.alphaTags}
        myRole={myRole}
        activeTab="tickets"
        isAdmin={canEditAnyDept || myRole === 'ADMIN'}
        myDepartments={myDepartments}
        onDepartmentChange={(deptId) => {
          setActiveDepartmentId(deptId);
          const found = myDepartments.find((d) => d.id === deptId);
          if (found) {
            setDepartment(found);
            setMyRole(found.myRole || (canEditAnyDept ? 'ADMIN' : null));
          }
        }}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* Success Banner */}
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Filters & Actions Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col gap-4">
          {/* Top row: State & Assignee pill selectors */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* State filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs text-slate-400 font-semibold mr-1">Status:</span>
              {[
                { value: '', label: 'All State' },
                { value: 'OPEN', label: 'Open' },
                { value: 'CLOSED', label: 'Closed' },
              ].map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => {
                    setMappedState(st.value as '' | 'OPEN' | 'CLOSED');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    mappedState === st.value
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Assignee filter pills (Take up pending tickets quick filter!) */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs text-slate-400 font-semibold mr-1">Queue:</span>
              {[
                { value: 'all', label: 'All Tickets' },
                { value: 'unassigned', label: 'Pending (Unassigned)' },
                { value: 'me', label: 'Assigned to Me' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setAssigneeMode(opt.value as 'all' | 'unassigned' | 'me');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    assigneeMode === opt.value
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom row: Search, Priority dropdown, Sort, and Clear */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative min-w-[240px] flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by title, ticket ID, or requester..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Priority Select */}
              <select
                aria-label="Filter tickets by priority"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(0);
                }}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="">All Priorities</option>
                <option value="1">Urgent (P1)</option>
                <option value="2">High (P2)</option>
                <option value="3">Medium (P3)</option>
                <option value="4">Low (P4)</option>
              </select>

              {/* Sort Select */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  aria-label="Sort tickets"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(0);
                  }}
                  className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="createdAt,desc">Newest First</option>
                  <option value="createdAt,asc">Oldest First</option>
                  <option value="priority,asc">Highest Priority</option>
                  <option value="slaDueAt,asc">SLA Due Date (Soonest)</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchTickets}
              disabled={loadingTickets}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
              title="Refresh ticket queue"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tickets Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loadingTickets ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Fetching tickets...</p>
            </div>
          ) : ticketsError ? (
            <div className="p-8 text-center text-red-600 text-xs font-semibold">
              <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              {ticketsError}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-500 mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Tickets Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {hasActiveFilters
                  ? 'No tickets match your active filter criteria. Try resetting your search or filter filters.'
                  : 'There are currently no tickets submitted for this department.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Reference</th>
                    <th className="py-3.5 px-4 font-semibold">Title & Details</th>
                    <th className="py-3.5 px-4 font-semibold">Priority</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Requester</th>
                    <th className="py-3.5 px-4 font-semibold">Assignee</th>
                    <th className="py-3.5 px-4 font-semibold">SLA Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {tickets.map((t) => {
                    const priorityCfg = getPriorityStyle(t.priority);
                    const displayRef = getTicketDisplayReference(t);
                    const assigneeId = t.assigneeId || (t as any).assignee?.id;
                    const assigneeName = t.assigneeName || (t as any).assignee?.fullName;
                    const requesterName = t.requesterName || (t as any).requester?.fullName || 'Requester';
                    const ticketTypeTitle = t.ticketTypeTitle || (t as any).ticketType?.title || 'Support Request';
                    const currentStatusName = t.currentStatusName || (t as any).status?.name || t.mappedState || 'OPEN';

                    const isUnassigned = !assigneeId;
                    const isAssignedToMe = Boolean(assigneeId && assigneeId === user?.id);

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => navigate(ROUTES.TICKETS.DETAILS(t.id))}
                      >
                        {/* Reference / ID */}
                        <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.TICKETS.DETAILS(t.id))}
                            className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            {displayRef}
                          </button>
                        </td>

                        {/* Title & Preview */}
                        <td className="py-4 px-4 min-w-[200px] max-w-sm">
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {t.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {ticketTypeTitle}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                            <span>{priorityCfg.label}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              t.mappedState === 'CLOSED'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {currentStatusName}
                          </span>
                        </td>

                        {/* Requester */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {getUserInitial(requesterName)}
                            </div>
                            <span className="text-slate-800 font-medium truncate max-w-[120px]">
                              {requesterName}
                            </span>
                          </div>
                        </td>

                        {/* Assignee */}
                        <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {assigneeName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {getUserInitial(assigneeName)}
                              </div>
                              <span className="text-slate-800 font-medium truncate max-w-[120px]">
                                {assigneeName}
                                {isAssignedToMe && (
                                  <span className="ml-1 text-[10px] text-indigo-600 font-semibold">(You)</span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* SLA Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {t.slaBreached ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              Breached
                            </span>
                          ) : t.slaDueAt ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(t.slaDueAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No SLA</span>
                          )}
                          {t.escalated && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Escalated
                            </span>
                          )}
                        </td>

                        {/* Actions (Take Up Pending Ticket button!) */}
                        <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {isUnassigned ? (
                            <button
                              type="button"
                              disabled={takingTicketId === t.id}
                              onClick={() => handleTakeTicket(t)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                              title="Assign this pending ticket to yourself"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>{takingTicketId === t.id ? 'Taking...' : 'Take Ticket'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate(ROUTES.TICKETS.DETAILS(t.id))}
                              className="text-slate-400 hover:text-slate-700 text-xs font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          {!loadingTickets && tickets.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Showing{' '}
                  <strong className="text-slate-900">
                    {page * size + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-900">
                    {Math.min((page + 1) * size, totalElements)}
                  </strong>{' '}
                  of <strong className="text-slate-900">{totalElements}</strong> tickets
                </span>
                <span className="text-slate-300">•</span>
                <select
                  aria-label="Items per page"
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium">
                  Page {page + 1} of {Math.max(1, totalPages)}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router';
import { 
  Search, 
  Plus, 
  Inbox, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpDown
} from 'lucide-react';
import { DataGridSkeleton } from '../../components/common/Skeletons';
import { ROUTES, APP_CONFIG } from '../../constants';
import { useAuth } from '../../store/authStore';
import { useTicketList } from '../../hooks';
import { getPriorityStyle, getTicketDisplayReference } from '../../utils/ticketUtils';
import { getUserInitial } from '../../utils/userUtils';

export const TicketListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, hasPrivilege } = useAuth();
  const canManage = isSuperAdmin || hasPrivilege('ADMIN_FULL_ACCESS');

  const {
    tickets,
    loading,
    filters,
    setFilter,
    handleSort,
    pagination,
  } = useTicketList();

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.assigneeId) ||
    filters.mappedState !== '' ||
    filters.priority !== '';

  const clearAllFilters = () => {
    setFilter('search', '');
    setFilter('status', '');
    setFilter('assigneeId', '');
    setFilter('mappedState', '');
    setFilter('priority', '');
  };

  const tabs: { key: 'my' | 'assigned' | 'shared' | 'all'; label: string }[] = [
    { key: 'my', label: 'My Requests' },
    { key: 'assigned', label: 'Assigned to Me' },
    { key: 'shared', label: 'Shared with Me' },
    ...(canManage ? [{ key: 'all' as const, label: 'All Company Tickets' }] : []),
  ];

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-4 shadow-xs">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Support Requests
          </h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.DEPARTMENT_TICKETS)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open your department support queue"
            >
              <Inbox className="w-4 h-4 text-indigo-600" />
              <span>Department Tickets</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.TICKETS.NEW)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6">
        
        {/* Navigation Tabs & Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col gap-4">
          
          {/* Top row: Tab pills & State switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {tabs.map((tab) => {
                const isActive = filters.tab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter('tab', tab.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
              <div className="h-4 w-px bg-slate-200 mx-1 shrink-0" />
              <button
                type="button"
                onClick={() => navigate(ROUTES.DEPARTMENT_TICKETS)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
                title="Triage incoming requests for your department"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Department Queue</span>
              </button>
            </div>

            {/* State filter: All / Open / Closed */}
            <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100/80 p-1 rounded-xl">
              {[
                { value: '', label: 'All' },
                { value: 'OPEN', label: 'Open' },
                { value: 'CLOSED', label: 'Closed' },
              ].map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setFilter('mappedState', st.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filters.mappedState === st.value
                      ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom row: Search input & Priority filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search requests by title, reference #, or person..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilter('search', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by priority"
                value={filters.priority}
                onChange={(e) => setFilter('priority', e.target.value)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="">All Priorities</option>
                <option value="1">Critical (P1)</option>
                <option value="2">High (P2)</option>
                <option value="3">Medium (P3)</option>
                <option value="4">Low (P4)</option>
              </select>

              {/* Per page size */}
              <select
                aria-label="Items per page"
                value={pagination.size}
                onChange={(e) => pagination.setSize(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                {APP_CONFIG.TICKETS.PAGE_SIZE_OPTIONS.map((sz) => (
                  <option key={sz} value={sz}>{sz} / page</option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200/60 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tickets Content Table / Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <DataGridSkeleton rows={6} columns={6} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No requests found</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              {hasActiveFilters 
                ? "No support requests matched your filters. Try clearing your search parameters."
                : "You don't have any support requests in this queue yet."}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(ROUTES.TICKETS.NEW)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit First Request</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-5">Request Reference</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:text-slate-600 select-none"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Submitted</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => {
                    const priorityCfg = getPriorityStyle(t.priority);
                    const isOpen = t.mappedState === 'OPEN';
                    const displayRef = getTicketDisplayReference(t);

                    return (
                      <tr
                        key={t.id}
                        onClick={() => navigate(ROUTES.TICKETS.DETAILS(t.displayId || t.id))}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Title & Short ID */}
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {t.title || t.ticketTypeTitle}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-500 font-bold">
                                {displayRef}
                              </span>
                              {t.title && t.ticketTypeTitle && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {t.ticketTypeTitle}
                                  </span>
                                </>
                              )}
                              {t.slaBreached && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                  <span>SLA Breached</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                            <span>{priorityCfg.label}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {isOpen ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-slate-400" />
                            )}
                            <span>{t.currentStatusName}</span>
                          </span>
                        </td>

                        {/* Requester */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                              {getUserInitial(t.requesterName)}
                            </div>
                            <span className="text-xs text-slate-700 font-medium">
                              {t.requesterName || 'Unknown'}
                            </span>
                          </div>
                        </td>

                        {/* Assignee */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {t.assigneeName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                {getUserInitial(t.assigneeName)}
                              </div>
                              <span className="text-xs text-slate-700 font-medium">
                                {t.assigneeName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{pagination.totalElements === 0 ? 0 : pagination.page * pagination.size + 1}</strong> to{' '}
                <strong className="text-slate-800">{Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}</strong> of{' '}
                <strong className="text-slate-800">{pagination.totalElements}</strong> requests
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page === 0}
                  onClick={pagination.prevPage}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="px-2 font-medium text-slate-600">
                  Page {pagination.totalPages > 0 ? pagination.page + 1 : 0} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages - 1}
                  onClick={pagination.nextPage}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

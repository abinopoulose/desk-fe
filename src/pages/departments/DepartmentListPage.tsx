import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2,
  Users,
  Search,
  Ticket,
  BarChart2,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { departmentApi } from '../../api/departmentApi';
import { useAuth } from '../../store/authStore';
import { ROUTES } from '../../constants';
import { useBreadcrumbStore } from '../../store/breadcrumbStore';
import type { MyDepartmentDTO } from '../../types/department';

export const DepartmentListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, hasPrivilege } = useAuth();
  const canEditAnyDept = isSuperAdmin || hasPrivilege('DEPARTMENT_EDIT');

  const [departments, setDepartments] = useState<MyDepartmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MEMBER'>('ALL');

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let myDepts = await departmentApi.getMyDepartments();

      // If user has zero direct memberships but has global admin privileges, provide all departments with ADMIN role
      if (myDepts.length === 0 && canEditAnyDept) {
        const allDepts = await departmentApi.getAllDepartments();
        myDepts = allDepts.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          alphaTags: d.alphaTags,
          myRole: 'ADMIN' as const,
          memberCount: 0,
        }));
      }

      setDepartments(myDepts);
      if (myDepts.length > 0) {
        const entries: Record<string, string> = {};
        myDepts.forEach((d) => {
          if (d.id && d.name) entries[d.id] = d.name;
        });
        useBreadcrumbStore.getState().setLabels(entries);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch departments', err);
      setError('Failed to load your departments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [canEditAnyDept]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const totalAdminCount = useMemo(() => {
    return departments.filter((d) => d.myRole === 'ADMIN' || canEditAnyDept).length;
  }, [departments, canEditAnyDept]);

  const totalMemberCount = useMemo(() => {
    return departments.reduce((acc, d) => acc + (d.memberCount || 0), 0);
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    let result = departments;

    if (roleFilter === 'ADMIN') {
      result = result.filter((d) => d.myRole === 'ADMIN' || canEditAnyDept);
    } else if (roleFilter === 'MEMBER') {
      result = result.filter((d) => d.myRole === 'MEMBER' && !canEditAnyDept);
    }

    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter((d) => {
      const matchName = d.name?.toLowerCase().includes(q);
      const matchDesc = d.description?.toLowerCase().includes(q);
      const matchTag = d.alphaTags?.some((t) => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchTag;
    });
  }, [departments, search, roleFilter, canEditAnyDept]);

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6">
        {/* Quick KPI Stat Chips */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Departments</div>
              <div className="text-sm font-bold text-slate-900">{departments.length}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Administering</div>
              <div className="text-sm font-bold text-slate-900">{totalAdminCount}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 col-span-2 sm:col-span-1 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Personnel</div>
              <div className="text-sm font-bold text-slate-900">{totalMemberCount}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search departments by name, tag, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({departments.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('ADMIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === 'ADMIN'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin ({totalAdminCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('MEMBER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === 'MEMBER'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Member ({departments.length - totalAdminCount})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchDepartments}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              title="Refresh departments"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchDepartments}
              className="font-semibold underline hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-slate-50 rounded-xl" />
                <div className="h-9 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDepartments.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {search || roleFilter !== 'ALL' ? 'No matching departments' : 'No departments assigned'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {search || roleFilter !== 'ALL'
                ? `No departments found matching your criteria. Try adjusting your search or filters.`
                : 'You are currently not assigned to any departments. Contact an organization administrator to be added to a department.'}
            </p>
            {(search || roleFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('ALL');
                }}
                className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Department Cards Grid */}
        {!loading && filteredDepartments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredDepartments.map((dept) => {
              const isAdmin = dept.myRole === 'ADMIN' || canEditAnyDept;

              return (
                <div
                  key={dept.id}
                  onClick={() => navigate(ROUTES.DEPARTMENT_DETAILS.MEMBERS(dept.id))}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-4">
                    {/* Header: Icon, Name, and Role Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                            {dept.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {dept.alphaTags && dept.alphaTags.length > 0 ? (
                              dept.alphaTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400">Department</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Role Pill */}
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                          <ShieldCheck className="w-3 h-3 text-purple-600" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          <Users className="w-3 h-3 text-blue-600" />
                          Member
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                      {dept.description || 'No description provided for this department.'}
                    </p>

                    {/* Team Roster Summary */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          <strong className="text-slate-900 font-bold">{dept.memberCount || 0}</strong> {dept.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isAdmin ? 'Admin Access' : 'Member Roster'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
                    {/* Primary Button: Focuses on Team & Member Management */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(ROUTES.DEPARTMENT_DETAILS.MEMBERS(dept.id));
                      }}
                      className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                        isAdmin
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{isAdmin ? 'Manage Members' : 'View Team Roster'}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                    </button>

                    {/* Secondary Navigation Links */}
                    <div
                      className="flex items-center justify-between text-xs pt-1 px-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.DEPARTMENT_DETAILS.TICKETS(dept.id))}
                        className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Ticket className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tickets</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => navigate(`${ROUTES.METRICS}?departmentId=${dept.id}`)}
                          className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Metrics</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

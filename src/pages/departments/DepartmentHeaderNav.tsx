import React from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Building2,
  Ticket,
  Users,
  BarChart2,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { ROUTES } from '../../constants';
import { useBreadcrumbStore } from '../../store/breadcrumbStore';

interface DepartmentHeaderNavProps {
  departmentId: string;
  departmentName?: string;
  description?: string;
  alphaTags?: string[];
  myRole?: 'ADMIN' | 'MEMBER' | null;
  activeTab: 'tickets' | 'members' | 'metrics';
  isAdmin?: boolean;
  myDepartments?: { id: string; name: string }[];
  onDepartmentChange?: (deptId: string) => void;
}

export const DepartmentHeaderNav: React.FC<DepartmentHeaderNavProps> = ({
  departmentId,
  departmentName,
  description,
  alphaTags = [],
  myRole,
  activeTab,
  isAdmin = false,
  myDepartments = [],
  onDepartmentChange,
}) => {
  const navigate = useNavigate();
  const canManage = isAdmin || myRole === 'ADMIN';

  React.useEffect(() => {
    if (departmentId && departmentName) {
      useBreadcrumbStore.getState().setLabel(departmentId, departmentName);
    }
  }, [departmentId, departmentName]);

  React.useEffect(() => {
    if (myDepartments && myDepartments.length > 0) {
      const entries: Record<string, string> = {};
      myDepartments.forEach((d) => {
        if (d.id && d.name) {
          entries[d.id] = d.name;
        }
      });
      useBreadcrumbStore.getState().setLabels(entries);
    }
  }, [myDepartments]);

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-0">
        {/* Breadcrumb & Back Link */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
          <Link
            to={ROUTES.DEPARTMENT_TICKETS}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Department Tickets</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-semibold truncate max-w-xs">
            {departmentName || 'Department'}
          </span>
        </div>

        {/* Title, Tags, and Role */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {departmentName || 'Department'}
              </h1>

              {/* Department switcher if user belongs to multiple departments */}
              {myDepartments && myDepartments.length > 1 && (
                <div className="relative inline-flex items-center ml-1">
                  <select
                    aria-label="Switch department"
                    value={departmentId}
                    onChange={(e) => {
                      const nextDeptId = e.target.value;
                      if (nextDeptId && nextDeptId !== departmentId) {
                        if (onDepartmentChange) {
                          onDepartmentChange(nextDeptId);
                        }
                        if (activeTab === 'tickets') {
                          navigate(ROUTES.DEPARTMENT_DETAILS.TICKETS(nextDeptId));
                        } else if (activeTab === 'members') {
                          navigate(ROUTES.DEPARTMENT_DETAILS.MEMBERS(nextDeptId));
                        } else if (activeTab === 'metrics') {
                          navigate(ROUTES.DEPARTMENT_DETAILS.METRICS(nextDeptId));
                        } else {
                          navigate(ROUTES.DEPARTMENT_DETAILS.TICKETS(nextDeptId));
                        }
                      }
                    }}
                    className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
                  >
                    {myDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
                </div>
              )}

              {alphaTags && alphaTags.length > 0 && (
                <div className="flex items-center gap-1.5 ml-1">
                  {alphaTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {myRole === 'ADMIN' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Admin
                </span>
              )}
              {myRole === 'MEMBER' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Member
                </span>
              )}
            </div>

            {description && (
              <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 overflow-x-auto">
          <div className="flex items-center gap-2">
            {/* Members & Team Tab (Accessible to all members) */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.DEPARTMENT_DETAILS.MEMBERS(departmentId))}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'members'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Members & Team</span>
            </button>

            {/* Tickets Tab (Accessible to both Members and Admins) */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.DEPARTMENT_DETAILS.TICKETS(departmentId))}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tickets'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Tickets</span>
            </button>
          </div>

          {/* Centralized Performance Metrics Link (Admin only) */}
          {canManage && (
            <button
              type="button"
              onClick={() => navigate(`${ROUTES.METRICS}?departmentId=${departmentId}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 my-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-colors cursor-pointer"
              title="Open customizable department performance analytics"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Performance Metrics ↗</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

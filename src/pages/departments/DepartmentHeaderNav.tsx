import React from 'react';
import { useNavigate } from 'react-router';
import {
  Building2,
  Ticket,
  Users,
  BarChart2,
  ShieldCheck,
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

  const handleDepartmentSwitch = (nextDeptId: string) => {
    if (nextDeptId && nextDeptId !== departmentId) {
      if (onDepartmentChange) {
        onDepartmentChange(nextDeptId);
      }
      if (activeTab === 'members') {
        navigate(ROUTES.DEPARTMENT_DETAILS.MEMBERS(nextDeptId));
      } else if (activeTab === 'metrics') {
        navigate(ROUTES.DEPARTMENT_DETAILS.METRICS(nextDeptId));
      } else if (window.location.pathname.startsWith('/departments/')) {
        navigate(ROUTES.DEPARTMENT_DETAILS.TICKETS(nextDeptId));
      }
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-5 pb-0">
        {/* Horizontal Department Switcher Tabs (when user belongs to multiple departments) */}
        {myDepartments && myDepartments.length > 1 && (
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1 select-none">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Departments:</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0" role="tablist" aria-label="Available departments">
              {myDepartments.map((dept) => {
                const isSelected = dept.id === departmentId;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleDepartmentSwitch(dept.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs ring-2 ring-indigo-600/20'
                        : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <span>{dept.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Title and Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {departmentName || 'Department'}
                </h1>
                {alphaTags && alphaTags.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {alphaTags[0]}
                  </span>
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
            </div>

            {description && (
              <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed pl-11">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 overflow-x-auto">
          <div className="flex items-center gap-2">
            {/* Tickets Tab (Primary) */}
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

            {/* Members & Team Tab */}
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


import { ROUTES } from '../../constants';
import { Outlet, NavLink } from 'react-router';
import { useAuth } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { PrivilegeGate } from '../auth/PrivilegeGate';
import {
  LayoutDashboard, FolderTree, Ticket, Network,
  Settings, Building2, Users, Clock, Database,
  BarChart3, UserCircle, Menu, ChevronLeft, ChevronRight,
  LogOut, ShieldCheck
} from 'lucide-react';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 group ${
    isActive 
      ? 'bg-indigo-50 text-indigo-700 font-medium' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  return (
    <NavLink to={to} className={navLinkClass}>
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
          <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function AppLayout() {
  const { user, hasPrivilege } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  const showAdmin = hasPrivilege('TICKET_TYPE_WRITE') || hasPrivilege('DEPARTMENT_WRITE') || hasPrivilege('ROLE_WRITE') || hasPrivilege('SLA_WRITE') || hasPrivilege('TENANT_MANAGE');
  const showAnalytics = hasPrivilege('METRICS_READ');

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500 whitespace-nowrap">
              Desk App
            </span>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar">
          {isSidebarOpen && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2 mb-1 px-3">Main</div>}
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/browse" icon={FolderTree} label="Browse Folders" />
          <NavItem to="/tickets/new" icon={Ticket} label="Create Ticket" />
          <NavItem to="/org-chart" icon={Network} label="Org Chart" />

          {showAdmin && (
            <>
              {isSidebarOpen && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-1 px-3">Admin</div>}
              <PrivilegeGate requiredPrivilege="TICKET_TYPE_WRITE">
                <NavItem to="/admin/ticket-types" icon={Settings} label="Ticket Types" />
              </PrivilegeGate>
              <PrivilegeGate requiredPrivilege="DEPARTMENT_WRITE">
                <NavItem to="/admin/departments" icon={Building2} label="Departments" />
              </PrivilegeGate>
              <PrivilegeGate requiredPrivilege="ROLE_WRITE">
                <NavItem to="/admin/roles" icon={Users} label="Roles & Users" />
              </PrivilegeGate>
              <PrivilegeGate requiredPrivilege="SLA_WRITE">
                <NavItem to="/admin/sla-configs" icon={Clock} label="SLA Configs" />
              </PrivilegeGate>
              <PrivilegeGate requiredPrivilege="TENANT_MANAGE">
                <NavItem to="/admin/tenant" icon={Database} label="Tenant Config" />
              </PrivilegeGate>
            </>
          )}
          
          {showAnalytics && (
            <>
              {isSidebarOpen && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-1 px-3">Analytics</div>}
              <PrivilegeGate requiredPrivilege="METRICS_READ">
                <NavItem to="/metrics" icon={BarChart3} label="Metrics" />
              </PrivilegeGate>
            </>
          )}
        </nav>
        
        <div className="p-3 border-t border-slate-100">
          {user && (
            <NavItem to={`/users/${user.id}`} icon={UserCircle} label="My Profile" />
          )}
          <button 
            onClick={() => {
              localStorage.removeItem('desk_token');
              window.location.href = ROUTES.AUTH.LOGIN;
            }} 
            className="w-full px-3 py-2.5 mt-1 rounded-lg transition-all duration-200 flex items-center gap-3 group text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 shrink-0 text-red-400 group-hover:text-red-600" />
            <span className={`font-medium transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 px-6 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-4">
             {!isSidebarOpen && (
               <button onClick={toggleSidebar} className="p-1.5 -ml-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                 <Menu className="w-5 h-5" />
               </button>
             )}
          </div>
          <div className="flex items-center gap-3">
             {user && (
               <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                   <p className="text-sm font-medium text-slate-900 leading-none mb-1">{user.fullName}</p>
                   <p className="text-xs text-slate-500 leading-none">{user.roles?.[0] || 'User'}</p>
                 </div>
                 <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200 shadow-sm">
                   {user.fullName.charAt(0).toUpperCase()}
                 </div>
               </div>
             )}
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar pb-24">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

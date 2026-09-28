import { Outlet, NavLink } from 'react-router';
import { useAuth } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { PrivilegeGate } from '../auth/PrivilegeGate';

export function AppLayout() {
  const { user, hasPrivilege } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md transition-colors flex items-center ${
      isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const showAdmin = hasPrivilege('TICKET_TYPE_WRITE') || hasPrivilege('DEPARTMENT_WRITE') || hasPrivilege('ROLE_WRITE') || hasPrivilege('SLA_WRITE') || hasPrivilege('TENANT_MANAGE');
  const showAnalytics = hasPrivilege('METRICS_READ');

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`bg-white shadow-md transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-16 overflow-hidden'}`}>
        <div className="p-4 border-b flex justify-between items-center h-16">
          {isSidebarOpen && <h1 className="text-xl font-bold whitespace-nowrap">Desk App</h1>}
          <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-200 ml-auto">
            {isSidebarOpen ? '←' : '→'}
          </button>
        </div>
        
        <nav className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
          {isSidebarOpen && <div className="text-xs font-bold text-gray-400 uppercase mt-2 mb-1">Main</div>}
          <NavLink to="/dashboard" className={navLinkClass}>{isSidebarOpen ? 'Dashboard' : 'DB'}</NavLink>
          <NavLink to="/browse" className={navLinkClass}>{isSidebarOpen ? 'Browse Folders' : 'BF'}</NavLink>
          <NavLink to="/tickets/new" className={navLinkClass}>{isSidebarOpen ? 'Create Ticket' : 'CT'}</NavLink>
          <NavLink to="/org-chart" className={navLinkClass}>{isSidebarOpen ? 'Org Chart' : 'OC'}</NavLink>

          {showAdmin && isSidebarOpen && <div className="text-xs font-bold text-gray-400 uppercase mt-4 mb-1">Admin</div>}
          <PrivilegeGate requiredPrivilege="TICKET_TYPE_WRITE">
             <NavLink to="/admin/ticket-types" className={navLinkClass}>{isSidebarOpen ? 'Ticket Types' : 'TT'}</NavLink>
          </PrivilegeGate>
          <PrivilegeGate requiredPrivilege="DEPARTMENT_WRITE">
             <NavLink to="/admin/departments" className={navLinkClass}>{isSidebarOpen ? 'Departments' : 'DP'}</NavLink>
          </PrivilegeGate>
          <PrivilegeGate requiredPrivilege="ROLE_WRITE">
             <NavLink to="/admin/roles" className={navLinkClass}>{isSidebarOpen ? 'Roles & Users' : 'RU'}</NavLink>
          </PrivilegeGate>
          <PrivilegeGate requiredPrivilege="SLA_WRITE">
             <NavLink to="/admin/sla-configs" className={navLinkClass}>{isSidebarOpen ? 'SLA Configuration' : 'SC'}</NavLink>
          </PrivilegeGate>
          <PrivilegeGate requiredPrivilege="TENANT_MANAGE">
             <NavLink to="/admin/tenant" className={navLinkClass}>{isSidebarOpen ? 'Tenant Settings' : 'TS'}</NavLink>
          </PrivilegeGate>
          
          {showAnalytics && isSidebarOpen && <div className="text-xs font-bold text-gray-400 uppercase mt-4 mb-1">Analytics</div>}
          <PrivilegeGate requiredPrivilege="METRICS_READ">
             <NavLink to="/metrics" className={navLinkClass}>{isSidebarOpen ? 'Metrics Dashboard' : 'MD'}</NavLink>
          </PrivilegeGate>

          {user && (
            <>
              {isSidebarOpen && <div className="text-xs font-bold text-gray-400 uppercase mt-4 mb-1">Account</div>}
              <NavLink to={`/users/${user.id}`} className={navLinkClass}>
                {isSidebarOpen ? 'My Profile' : 'MP'}
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm h-16 px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
             {!isSidebarOpen && (
               <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-200 hidden md:block">
                 ☰
               </button>
             )}
             <h2 className="text-lg font-semibold">Header</h2>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }} 
            className="text-red-500"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { ROUTES, navConfig } from '../../constants';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { PrivilegeGate } from '../auth/PrivilegeGate';
import {
  UserCircle, Menu, ChevronLeft, ChevronRight,
  LogOut, ShieldCheck, AlertTriangle
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
  const { isSidebarOpen, toggleSidebar, isBackendDown } = useAppStore();
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showAdmin = hasPrivilege('TICKET_TYPE_WRITE') || hasPrivilege('DEPARTMENT_WRITE') || hasPrivilege('ROLE_WRITE') || hasPrivilege('SLA_WRITE') || hasPrivilege('USER_INVITE');
  const showAnalytics = hasPrivilege('METRICS_READ');

  const handleLogout = () => {
    localStorage.removeItem('desk_token');
    window.location.href = ROUTES.AUTH.LOGIN;
  };

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
        
        <nav className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar pb-6">
          {isSidebarOpen && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2 mb-1 px-3">Main</div>}
          {navConfig.filter(n => n.group === 'main').map(n => (
            <NavItem key={n.to} to={n.to} icon={n.icon} label={n.label} />
          ))}

          {showAdmin && (
            <>
              {isSidebarOpen && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-1 px-3">Admin</div>}
              {navConfig.filter(n => n.group === 'admin').map(n => (
                <PrivilegeGate key={n.to} requiredPrivilege={n.requiredPrivilege as any}>
                  <NavItem to={n.to} icon={n.icon} label={n.label} />
                </PrivilegeGate>
              ))}
            </>
          )}
          
          {showAnalytics && (
            <>
              {isSidebarOpen && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-1 px-3">Analytics</div>}
              {navConfig.filter(n => n.group === 'analytics').map(n => (
                <PrivilegeGate key={n.to} requiredPrivilege={n.requiredPrivilege as any}>
                  <NavItem to={n.to} icon={n.icon} label={n.label} />
                </PrivilegeGate>
              ))}
            </>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {isBackendDown && (
          <div className="bg-red-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium z-50 shadow-sm w-full">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Cannot connect to the server. Please check your network connection or try again later.</span>
          </div>
        )}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 px-6 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1 h-full">
             {!isSidebarOpen && (
               <button onClick={toggleSidebar} className="p-1.5 -ml-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                 <Menu className="w-5 h-5" />
               </button>
             )}
             <div id="header-portal-target" className="flex-1 flex items-center h-full" />
          </div>
          <div className="flex items-center gap-3 relative" ref={profileMenuRef}>
             {user && (
               <>
                 <div 
                   className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 py-1.5 px-2 -mr-2 rounded-lg transition-colors"
                   onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                 >
                   <div className="text-right hidden sm:block">
                     <p className="text-sm font-medium text-slate-900 leading-none mb-1">{user.fullName}</p>
                     <p className="text-xs text-slate-500 leading-none">{user.roles?.[0] || 'User'}</p>
                   </div>
                   <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200 shadow-sm overflow-hidden">
                     {user.profilePictureUrl ? (
                       <img src={user.profilePictureUrl} alt={user.fullName} className="w-full h-full object-cover" />
                     ) : (
                       user.fullName.charAt(0).toUpperCase()
                     )}
                   </div>
                 </div>

                 {isProfileMenuOpen && (
                   <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                     <button
                       onClick={() => {
                         setIsProfileMenuOpen(false);
                         navigate(`/users/${user.id}`);
                       }}
                       className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                     >
                       <UserCircle className="w-4 h-4 text-slate-400" />
                       My Profile
                     </button>
                     <button
                       onClick={handleLogout}
                       className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                     >
                       <LogOut className="w-4 h-4 text-red-400" />
                       Logout
                     </button>
                   </div>
                 )}
               </>
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

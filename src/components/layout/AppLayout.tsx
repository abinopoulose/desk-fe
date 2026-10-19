import { PageTransition } from "../common/PageTransition";
import { useState, useEffect } from 'react';
import type { MouseEvent, ComponentType } from 'react';
import { ROUTES, navConfig, APP_NAME } from '../../constants';
import type { NavGroup } from '../../constants';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { useAuth, useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import {
  Menu, ChevronLeft,
  LogOut, ShieldCheck, AlertTriangle,
  PlusCircle, ChevronDown, UserCircle, Search, Bell
} from 'lucide-react';
import { 
  SwipeableDrawer, Drawer, useMediaQuery, useTheme, IconButton, 
  Collapse, Divider, Breadcrumbs, Link as MuiLink, 
  Avatar, Menu as MuiMenu, MenuItem, Tooltip, Badge, InputBase, Box
} from '@mui/material';
import { LAYOUT } from '../../theme/tokens';
import { getUserSlug } from '../../utils/userUtils';
import { LogoIcon } from '../common/Logo';
import { useBreadcrumbStore } from '../../store/breadcrumbStore';
import {
  isUuidLike,
  formatRouteSegment,
  getFallbackSegmentLabel,
  getBreadcrumbHref,
} from '../../utils/breadcrumbUtils';
import { departmentApi } from '../../api/departmentApi';
import { ticketApi } from '../../api/ticketApi';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import { getUserProfile } from '../../api/userApi';

interface NavItemProps {
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  isSidebarOpen: boolean;
}

function NavItem({ to, icon: Icon, label, isSidebarOpen }: NavItemProps) {
  const linkNode = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative transition-all duration-150 flex items-center group ${
          isSidebarOpen
            ? `px-3 py-2 rounded-xl text-xs gap-3 font-medium ${
                isActive
                  ? 'bg-indigo-50/90 text-indigo-700 font-semibold border border-indigo-100/90 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`
            : `w-10 h-10 mx-auto justify-center rounded-xl ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && isSidebarOpen && (
            <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full" />
          )}
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
          {isSidebarOpen && (
            <span className="truncate whitespace-nowrap text-xs">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  if (!isSidebarOpen) {
    return (
      <Tooltip title={label} placement="right" arrow>
        <div className="flex justify-center w-full my-0.5">{linkNode}</div>
      </Tooltip>
    );
  }

  return <div className="w-full my-0.5">{linkNode}</div>;
}

function NavGroupRenderer({ group, isSidebarOpen, hasPrivilege }: { group: NavGroup, isSidebarOpen: boolean, hasPrivilege: (p: string) => boolean }) {
  const [open, setOpen] = useState(() => {
    if (!group.collapsible) return true;
    const saved = localStorage.getItem(`nav_group_${group.label}`);
    return saved !== null ? saved === 'true' : !!group.defaultOpen;
  });

  const handleToggle = () => {
    if (!group.collapsible) return;
    const newState = !open;
    setOpen(newState);
    localStorage.setItem(`nav_group_${group.label}`, String(newState));
  };

  const visibleItems = group.items.filter(item => !item.requiredPrivilege || hasPrivilege(item.requiredPrivilege));
  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-3">
      {isSidebarOpen ? (
        <div 
          className={`flex items-center justify-between px-3 py-1.5 mb-1 select-none ${group.collapsible ? 'cursor-pointer hover:bg-slate-50 rounded-lg transition-colors' : ''}`}
          onClick={handleToggle}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(); }}
          tabIndex={group.collapsible ? 0 : undefined}
          aria-expanded={group.collapsible ? open : undefined}
          role={group.collapsible ? 'button' : undefined}
          aria-label={group.collapsible ? `Toggle ${group.label}` : undefined}
        >
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
            {group.label}
          </span>
          {group.collapsible && (
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
          )}
        </div>
      ) : (
        <div className="w-8 mx-auto h-px bg-slate-100 my-2" />
      )}
      <Collapse in={open || !isSidebarOpen} timeout="auto" unmountOnExit>
        <div className="flex flex-col">
          {visibleItems.map(item => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} isSidebarOpen={isSidebarOpen} />
          ))}
        </div>
      </Collapse>
    </div>
  );
}

const pendingBreadcrumbFetches = new Set<string>();

function HeaderBreadcrumbs({ pathname }: { pathname: string }) {
  const navigate = useNavigate();
  const { labels, setLabel } = useBreadcrumbStore();
  const paths = pathname.split('/').filter(Boolean);

  useEffect(() => {
    paths.forEach((segment, index) => {
      if (!segment || labels[segment] || pendingBreadcrumbFetches.has(segment)) return;
      const prevSegment = index > 0 ? paths[index - 1].toLowerCase() : undefined;

      if (prevSegment === 'departments' && isUuidLike(segment)) {
        pendingBreadcrumbFetches.add(segment);
        departmentApi
          .getDepartmentById(segment)
          .then((dept) => {
            if (dept?.name) setLabel(segment, dept.name);
          })
          .catch(() => {})
          .finally(() => {
            pendingBreadcrumbFetches.delete(segment);
          });
      } else if (prevSegment === 'tickets' && isUuidLike(segment)) {
        pendingBreadcrumbFetches.add(segment);
        ticketApi
          .getTicketDetails(segment)
          .then((t) => {
            const label = t?.displayId || t?.title || 'Ticket Details';
            if (label) setLabel(segment, label);
          })
          .catch(() => {})
          .finally(() => {
            pendingBreadcrumbFetches.delete(segment);
          });
      } else if (prevSegment === 'ticket-types' && isUuidLike(segment)) {
        pendingBreadcrumbFetches.add(segment);
        ticketTypeApi
          .getTicketTypeById(segment)
          .then((tt) => {
            if (tt?.title) setLabel(segment, tt.title);
          })
          .catch(() => {})
          .finally(() => {
            pendingBreadcrumbFetches.delete(segment);
          });
      } else if (prevSegment === 'users') {
        pendingBreadcrumbFetches.add(segment);
        getUserProfile(segment)
          .then((u) => {
            if (u?.fullName) setLabel(segment, u.fullName);
          })
          .catch(() => {})
          .finally(() => {
            pendingBreadcrumbFetches.delete(segment);
          });
      }
    });
  }, [pathname, labels, setLabel]);

  if (paths.length === 0) return <span className="font-semibold text-slate-800 text-lg">Dashboard</span>;

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <MuiLink
        underline="hover"
        color="inherit"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          navigate('/');
        }}
        className="cursor-pointer hover:text-indigo-600 transition-colors"
      >
        Home
      </MuiLink>
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const prevSegment = index > 0 ? paths[index - 1] : undefined;
        const isUuid = isUuidLike(path);

        let name = '';
        if (labels[path]) {
          name = labels[path];
        } else if (isUuid) {
          name = getFallbackSegmentLabel(path, prevSegment);
        } else if (paths[0] === 'users' && index === 1) {
          name = path;
        } else {
          name = formatRouteSegment(path);
        }

        const href = getBreadcrumbHref(paths, index);

        return isLast ? (
          <span key={`${path}-${index}`} className="font-semibold text-slate-800">
            {name}
          </span>
        ) : (
          <MuiLink
            key={`${path}-${index}`}
            underline="hover"
            color="inherit"
            href={href}
            onClick={(e) => {
              e.preventDefault();
              navigate(href);
            }}
            className="cursor-pointer hover:text-indigo-600 transition-colors"
          >
            {name}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
}

export function AppLayout() {
  const { user, hasPrivilege } = useAuth();
  const { isSidebarOpen, toggleSidebar, setSidebarOpen, isBackendDown } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const routeName = location.pathname.split("/").filter(Boolean).pop() || "Dashboard";
    document.title = `${routeName.charAt(0).toUpperCase() + routeName.slice(1).replace(/-/g, " ")} | ${APP_NAME}`;
  }, [location.pathname]);

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const drawerContent = (
    <div
      className="h-full bg-white flex flex-col transition-all duration-300 select-none"
      style={{ width: isSidebarOpen ? LAYOUT.SIDEBAR_WIDTH : LAYOUT.SIDEBAR_COLLAPSED_WIDTH }}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 shrink-0 bg-white">
        {isSidebarOpen ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <LogoIcon size={36} badge={true} className="shrink-0 shadow-xs rounded-xl" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                {APP_NAME}
              </span>
              <span className="text-2xs font-semibold text-indigo-600 tracking-wider uppercase leading-none">
                Enterprise Hub
              </span>
            </div>
          </div>
        ) : (
          <Tooltip title="Expand sidebar" placement="right" arrow>
            <button
              type="button"
              onClick={toggleSidebar}
              className="mx-auto flex items-center justify-center cursor-pointer"
            >
              <LogoIcon size={36} badge={true} className="shadow-xs rounded-xl hover:shadow transition-all" />
            </button>
          </Tooltip>
        )}
        {!isMobile && isSidebarOpen && (
          <button 
            type="button"
            onClick={toggleSidebar} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Primary Action Button */}
      <div className="p-3 shrink-0">
        {isSidebarOpen ? (
          <button
            type="button"
            onClick={() => navigate(ROUTES.TICKETS.NEW)}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all group cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>Create Ticket</span>
          </button>
        ) : (
          <Tooltip title="Create Ticket" placement="right" arrow>
            <button
              type="button"
              onClick={() => navigate(ROUTES.TICKETS.NEW)}
              className="w-10 h-10 mx-auto flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-xs hover:shadow transition-all group cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="px-3 flex flex-col flex-1 overflow-y-auto no-scrollbar pb-2">
        {navConfig.map(group => (
          <NavGroupRenderer key={group.label} group={group} isSidebarOpen={isSidebarOpen} hasPrivilege={hasPrivilege} />
        ))}
      </nav>

    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {isMobile ? (
        <SwipeableDrawer
          variant="temporary"
          anchor="left"
          open={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: LAYOUT.SIDEBAR_WIDTH,
              borderRight: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#ffffff'
            }
          }}
        >
          {drawerContent}
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="permanent"
          open={isSidebarOpen}
          sx={{
            '& .MuiDrawer-paper': {
              width: isSidebarOpen ? LAYOUT.SIDEBAR_WIDTH : LAYOUT.SIDEBAR_COLLAPSED_WIDTH,
              position: 'relative',
              overflowX: 'hidden',
              borderRight: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: 'none',
              backgroundColor: '#ffffff',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen
              })
            }
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        {isBackendDown && (
          <div className="bg-red-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium z-50 shadow-sm w-full">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Cannot connect to the server. Please check your network connection or try again later.</span>
          </div>
        )}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 px-6 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1 h-full max-w-full overflow-hidden">
             {(!isSidebarOpen || isMobile) && (
               <IconButton onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu" edge="start" sx={{ ml: -1 }}>
                 <Menu className="w-5 h-5 text-slate-500" />
               </IconButton>
             )}
             <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>
               <HeaderBreadcrumbs pathname={location.pathname} />
             </Box>
             
             {/* Portal target so other components can still inject here if they want */}
             <div id="header-portal-target" className="flex-1 flex items-center h-full min-w-0" />
          </div>
          
          <div className="flex items-center gap-2 ml-auto shrink-0">
             <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', bgcolor: 'slate.100', borderRadius: 2, px: 2, py: 0.5, mr: 2 }}>
               <Search className="w-4 h-4 text-slate-400 mr-2" />
               <InputBase placeholder="Search..." sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }} />
             </Box>
             {isMobile && (
               <Tooltip title="Search">
                 <IconButton aria-label="Search">
                   <Search className="w-5 h-5 text-slate-600" />
                 </IconButton>
               </Tooltip>
             )}
             
             <Tooltip title="Notifications">
               <IconButton aria-label="Notifications">
                 <Badge color="error" variant="dot">
                   <Bell className="w-5 h-5 text-slate-600" />
                 </Badge>
               </IconButton>
             </Tooltip>

             {user && (
               <>
                 <Tooltip title="User menu">
                   <IconButton
                     onClick={handleMenuOpen}
                     size="small"
                     sx={{ ml: 1 }}
                     aria-haspopup="true"
                     aria-label="User menu"
                   >
                     <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                       {user.fullName.charAt(0).toUpperCase()}
                     </Avatar>
                   </IconButton>
                 </Tooltip>
                 <MuiMenu
                   anchorEl={anchorEl}
                   open={Boolean(anchorEl)}
                   onClose={handleMenuClose}
                   onClick={handleMenuClose}
                   transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                   anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                 >
                   <MenuItem onClick={() => navigate(ROUTES.USERS.PROFILE(getUserSlug(user)))}>
                     <UserCircle className="w-4 h-4 mr-2 text-slate-500" /> My Profile
                   </MenuItem>
                   <MenuItem onClick={() => navigate(`${ROUTES.USERS.PROFILE(getUserSlug(user))}?tab=sessions`)}>
                     <ShieldCheck className="w-4 h-4 mr-2 text-slate-500" /> Active Sessions & Security
                   </MenuItem>
                   <Divider />
                   <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                     <LogOut className="w-4 h-4 mr-2" /> Logout
                   </MenuItem>
                 </MuiMenu>
               </>
             )}
          </div>
        </header>
        <main
          id="main-content"
          className={`flex-1 ${location.pathname === ROUTES.ORG_CHART ? 'overflow-hidden' : 'overflow-y-auto'} no-scrollbar w-full flex flex-col`}
          tabIndex={-1}
        >
          <div className="w-full flex-1 flex flex-col min-h-full">
            <PageTransition pathname={location.pathname}><Outlet /></PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}

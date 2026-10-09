import { AnimatePresence, motion } from "framer-motion";
import { PageTransition } from "../common/PageTransition";
import { useState, useEffect } from 'react';
import type { MouseEvent, ComponentType } from 'react';
import { ROUTES, navConfig } from '../../constants';
import type { NavGroup } from '../../constants';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import {
  Menu, ChevronLeft, ChevronRight,
  LogOut, ShieldCheck, AlertTriangle,
  PlusCircle, ChevronDown, ChevronUp, UserCircle, Search, Bell
} from 'lucide-react';
import { 
  SwipeableDrawer, Drawer, useMediaQuery, useTheme, IconButton, 
  Collapse, Button, Divider, Breadcrumbs, Link as MuiLink, 
  Avatar, Menu as MuiMenu, MenuItem, Tooltip, Badge, InputBase, Box
} from '@mui/material';
import { LAYOUT } from '../../theme/tokens';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 group ${
    isActive 
      ? 'bg-indigo-50 text-indigo-700 font-medium' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

interface NavItemProps {
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  isSidebarOpen: boolean;
}

function NavItem({ to, icon: Icon, label, isSidebarOpen }: NavItemProps) {
  return (
    <motion.div layout>
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
    </motion.div>
  );
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
    <div className="mb-4">
      {isSidebarOpen && (
        <div 
          className={`flex items-center justify-between px-3 py-2 mb-1 ${group.collapsible ? 'cursor-pointer hover:bg-slate-50 rounded-md transition-colors' : ''}`}
          onClick={handleToggle}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(); }}
          tabIndex={group.collapsible ? 0 : undefined}
          aria-expanded={group.collapsible ? open : undefined}
          role={group.collapsible ? 'button' : undefined}
          aria-label={group.collapsible ? `Toggle ${group.label}` : undefined}
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {group.label}
          </span>
          {group.collapsible && (
            open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      )}
      <Collapse in={open || !isSidebarOpen} timeout="auto" unmountOnExit>
        <div className="flex flex-col gap-1">
          {visibleItems.map(item => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} isSidebarOpen={isSidebarOpen} />
          ))}
        </div>
      </Collapse>
    </div>
  );
}

function HeaderBreadcrumbs({ pathname }: { pathname: string }) {
  const paths = pathname.split('/').filter(Boolean);
  if (paths.length === 0) return <span className="font-semibold text-slate-800 text-lg">Dashboard</span>;

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <MuiLink underline="hover" color="inherit" href="/" onClick={(e) => { e.preventDefault(); }}>
        Home
      </MuiLink>
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const name = path.charAt(0).toUpperCase() + path.slice(1);
        return isLast ? (
          <span key={path} className="font-semibold text-slate-800">
            {name}
          </span>
        ) : (
          <MuiLink key={path} underline="hover" color="inherit" href={`/${paths.slice(0, index + 1).join('/')}`}>
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

  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const routeName = location.pathname.split("/").filter(Boolean).pop() || "Dashboard";
    document.title = `${routeName.charAt(0).toUpperCase() + routeName.slice(1).replace(/-/g, " ")} | Desk`;
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('desk_token');
    window.location.href = ROUTES.AUTH.LOGIN;
  };

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const drawerContent = (
    <div className={`h-full bg-white flex flex-col transition-all duration-300`} style={{ width: isSidebarOpen ? LAYOUT.SIDEBAR_WIDTH : LAYOUT.SIDEBAR_COLLAPSED_WIDTH }}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
        <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
          <div className="bg-indigo-600 p-1.5 rounded-lg shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500 whitespace-nowrap">
            Desk App
          </span>
        </div>
        {!isMobile && (
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      <div className="p-3">
        <Button
          variant="contained"
          fullWidth
          startIcon={isSidebarOpen ? <PlusCircle size={20} /> : undefined}
          onClick={() => navigate(ROUTES.TICKETS.NEW)}
          sx={{ 
            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            minWidth: isSidebarOpen ? undefined : '36px',
            px: isSidebarOpen ? 2 : 0,
            py: 1,
            textTransform: 'none',
            borderRadius: '8px',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' }
          }}
        >
          {isSidebarOpen ? 'Create Ticket' : <PlusCircle size={20} />}
        </Button>
      </div>

      <nav className="px-3 flex flex-col flex-1 overflow-y-auto no-scrollbar pb-4">
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
          sx={{ '& .MuiDrawer-paper': { width: LAYOUT.SIDEBAR_WIDTH } }}
        >
          {drawerContent}
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="permanent"
          open={isSidebarOpen}
          sx={{ '& .MuiDrawer-paper': { width: isSidebarOpen ? LAYOUT.SIDEBAR_WIDTH : LAYOUT.SIDEBAR_COLLAPSED_WIDTH, position: 'relative', overflowX: 'hidden', transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }) } }}
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
                   <MenuItem onClick={() => navigate(`/users/${user.id}`)}>
                     <UserCircle className="w-4 h-4 mr-2 text-slate-500" /> My Profile
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
        <main id="main-content" className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar pb-24 w-full" tabIndex={-1}>
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait"><PageTransition pathname={location.pathname}><Outlet /></PageTransition></AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

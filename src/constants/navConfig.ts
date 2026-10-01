import {
  LayoutDashboard, FolderTree, Ticket, Network,
  Settings, Building2, Users, Clock, Database,
  BarChart3
} from 'lucide-react';
import { ROUTES } from './routes';

export interface NavItemConfig {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiredPrivilege?: string;
  group: 'main' | 'admin' | 'analytics';
}

export const navConfig: NavItemConfig[] = [
  { group: 'main', to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { group: 'main', to: ROUTES.BROWSE, icon: FolderTree, label: 'Browse Folders' },
  { group: 'main', to: ROUTES.TICKETS.NEW, icon: Ticket, label: 'Create Ticket' },
  { group: 'main', to: ROUTES.ORG_CHART, icon: Network, label: 'Org Chart' },
  
  { group: 'admin', to: ROUTES.ADMIN.TICKET_TYPES, icon: Settings, label: 'Ticket Types', requiredPrivilege: 'TICKET_TYPE_WRITE' },
  { group: 'admin', to: ROUTES.ADMIN.DEPARTMENTS, icon: Building2, label: 'Departments', requiredPrivilege: 'DEPARTMENT_WRITE' },
  { group: 'admin', to: ROUTES.ADMIN.EMPLOYEES, icon: Users, label: 'Employees', requiredPrivilege: 'USER_INVITE' },
  { group: 'admin', to: ROUTES.ADMIN.ROLES, icon: Users, label: 'Roles & Permissions', requiredPrivilege: 'ROLE_WRITE' },
  { group: 'admin', to: ROUTES.ADMIN.SLA_CONFIGS, icon: Clock, label: 'SLA Configs', requiredPrivilege: 'SLA_WRITE' },
  
  { group: 'analytics', to: ROUTES.METRICS, icon: BarChart3, label: 'Metrics', requiredPrivilege: 'METRICS_READ' },
];

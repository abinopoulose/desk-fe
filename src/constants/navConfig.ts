import type { ComponentType } from "react";
import {
  LayoutDashboard, Network,
  Settings, Building2, Users, Shield,
  BarChart3
} from 'lucide-react';
import { ROUTES } from './routes';

export interface NavItemConfig {
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  requiredPrivilege?: string;
}

export interface NavGroup {
  label: string;
  items: NavItemConfig[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const navConfig: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
      { to: ROUTES.DEPARTMENTS, icon: Building2, label: 'My Departments' },
      { to: ROUTES.ORG_CHART, icon: Network, label: 'Org Chart' },
      { to: ROUTES.METRICS, icon: BarChart3, label: 'Metrics', requiredPrivilege: 'DEPARTMENT_EDIT' },
    ],
  },
  {
    label: 'Administration',
    collapsible: true,
    defaultOpen: true,
    items: [
      { to: ROUTES.ADMIN.TICKET_TYPES, icon: Settings, label: 'Ticket Master', requiredPrivilege: 'TICKET_TYPE_EDIT' },
      { to: ROUTES.ADMIN.DEPARTMENTS, icon: Building2, label: 'Departments', requiredPrivilege: 'DEPARTMENT_EDIT' },
      { to: ROUTES.ADMIN.EMPLOYEES, icon: Users, label: 'Employees', requiredPrivilege: 'USER_EDIT' },
      { to: ROUTES.ADMIN.ROLES, icon: Shield, label: 'Roles & Permissions', requiredPrivilege: 'ROLE_EDIT' },
    ],
  }
];

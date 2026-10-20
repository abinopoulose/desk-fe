import { describe, it, expect } from 'vitest';
import {
  isUuidLike,
  formatRouteSegment,
  getFallbackSegmentLabel,
  getBreadcrumbHref,
  getPageTitle,
} from './breadcrumbUtils';

describe('breadcrumbUtils', () => {
  describe('isUuidLike', () => {
    it('detects standard UUIDs', () => {
      expect(isUuidLike('c3cf6db0-0000-0000-0000-000000000020')).toBe(true);
      expect(isUuidLike('C3CF6DB0-0000-0000-0000-000000000020')).toBe(true);
      expect(isUuidLike('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('detects 32-character hex and 24-character hex strings', () => {
      expect(isUuidLike('507f1f77bcf86cd799439011')).toBe(true);
      expect(isUuidLike('c3cf6db0000000000000000000000020')).toBe(true);
    });

    it('returns false for regular words, slugs, and filenames', () => {
      expect(isUuidLike('departments')).toBe(false);
      expect(isUuidLike('tickets')).toBe(false);
      expect(isUuidLike('abino')).toBe(false);
      expect(isUuidLike('abino.poulose.123')).toBe(false);
      expect(isUuidLike('ticket-types')).toBe(false);
      expect(isUuidLike('')).toBe(false);
    });
  });

  describe('formatRouteSegment', () => {
    it('returns predefined human-readable labels', () => {
      expect(formatRouteSegment('admin')).toBe('Admin');
      expect(formatRouteSegment('ticket-types')).toBe('Ticket Types');
      expect(formatRouteSegment('department-tickets')).toBe('Department Tickets');
      expect(formatRouteSegment('sla-configs')).toBe('SLA Configurations');
      expect(formatRouteSegment('org-chart')).toBe('Organization Chart');
      expect(formatRouteSegment('departments')).toBe('Departments');
      expect(formatRouteSegment('tickets')).toBe('Tickets');
      expect(formatRouteSegment('users')).toBe('Users');
      expect(formatRouteSegment('browse')).toBe('Service Catalog');
    });

    it('formats kebab-case into title case', () => {
      expect(formatRouteSegment('system-settings')).toBe('System Settings');
      expect(formatRouteSegment('audit-logs')).toBe('Audit Logs');
    });
  });

  describe('getFallbackSegmentLabel', () => {
    it('returns context-aware fallback labels', () => {
      expect(getFallbackSegmentLabel('some-id', 'departments')).toBe('Department');
      expect(getFallbackSegmentLabel('some-id', 'tickets')).toBe('Ticket');
      expect(getFallbackSegmentLabel('some-id', 'ticket-types')).toBe('Ticket Type');
      expect(getFallbackSegmentLabel('some-id', 'users')).toBe('User Profile');
      expect(getFallbackSegmentLabel('some-id', 'unknown')).toBe('Details');
    });
  });

  describe('getBreadcrumbHref', () => {
    it('generates correct target link for department ID', () => {
      const paths = ['departments', 'c3cf6db0-0000-0000-0000-000000000020', 'tickets'];
      expect(getBreadcrumbHref(paths, 1)).toBe('/departments/c3cf6db0-0000-0000-0000-000000000020/tickets');
    });

    it('generates correct target link for ticket type ID', () => {
      const paths = ['admin', 'ticket-types', 'uuid-1234', 'edit'];
      expect(getBreadcrumbHref(paths, 2)).toBe('/admin/ticket-types/uuid-1234/edit');
    });

    it('generates /dashboard for tickets root', () => {
      const paths = ['tickets', 'uuid-1234'];
      expect(getBreadcrumbHref(paths, 0)).toBe('/dashboard');
    });
  });

  describe('getPageTitle', () => {
    const user = { id: 'u-1', fullName: 'Abino Poulose', email: 'abino@desk.com' };

    it('resolves core and admin page titles accurately', () => {
      expect(getPageTitle('/')).toBe('Dashboard');
      expect(getPageTitle('/dashboard')).toBe('Dashboard');
      expect(getPageTitle('/org-chart')).toBe('Organization Chart');
      expect(getPageTitle('/department-tickets')).toBe('Department Tickets');
      expect(getPageTitle('/departments/dept-1/tickets')).toBe('Department Tickets');
      expect(getPageTitle('/departments/dept-1/members')).toBe('Department Members');
      expect(getPageTitle('/departments/dept-1/metrics')).toBe('Department Metrics');
      expect(getPageTitle('/departments')).toBe('Departments');
      expect(getPageTitle('/admin/roles')).toBe('Roles & Permissions');
      expect(getPageTitle('/admin/employees')).toBe('Employees');
      expect(getPageTitle('/admin/departments')).toBe('Departments');
      expect(getPageTitle('/admin/ticket-types')).toBe('Ticket Types');
      expect(getPageTitle('/admin/ticket-types/new')).toBe('Create Ticket Type');
      expect(getPageTitle('/admin/ticket-types/tt-1/edit')).toBe('Edit Ticket Type');
      expect(getPageTitle('/admin/ticket-types/tt-1/statuses')).toBe('Ticket Statuses');
      expect(getPageTitle('/metrics')).toBe('Performance Metrics');
      expect(getPageTitle('/tickets/new')).toBe('Create Request');
      expect(getPageTitle('/tickets/t-1')).toBe('Ticket Details');
      expect(getPageTitle('/browse')).toBe('Service Catalog');
    });

    it('distinguishes between My Profile and other User Profile', () => {
      expect(getPageTitle('/users/u-1', user)).toBe('My Profile');
      expect(getPageTitle('/users/abino-poulose', user)).toBe('My Profile');
      expect(getPageTitle('/users/abino', user)).toBe('My Profile');
      expect(getPageTitle('/users/other-user-99', user)).toBe('User Profile');
    });
  });
});

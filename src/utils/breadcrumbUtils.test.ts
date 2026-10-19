import { describe, it, expect } from 'vitest';
import {
  isUuidLike,
  formatRouteSegment,
  getFallbackSegmentLabel,
  getBreadcrumbHref,
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
});

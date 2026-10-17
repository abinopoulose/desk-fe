import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSubdomain, buildTenantUrl, extractSsoToken } from './subdomain';

describe('subdomain utilities', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset window.location mock
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  const mockLocation = (loc: Partial<Location>) => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        protocol: 'http:',
        pathname: '/',
        search: '',
        hash: '',
        port: '',
        ...loc,
      },
    });
  };

  describe('getSubdomain', () => {
    it('extracts subdomain from abino.localhost', () => {
      mockLocation({ hostname: 'abino.localhost' });
      expect(getSubdomain()).toBe('abino');
    });

    it('extracts subdomain from firmname.desk.abino in prod', () => {
      mockLocation({ hostname: 'firmname.desk.abino' });
      expect(getSubdomain()).toBe('firmname');
    });

    it('extracts subdomain from firmname.desk.abino.in in prod', () => {
      mockLocation({ hostname: 'firmname.desk.abino.in' });
      expect(getSubdomain()).toBe('firmname');
    });

    it('extracts subdomain from tenant.desk.example.com', () => {
      mockLocation({ hostname: 'tenant.desk.example.com' });
      expect(getSubdomain()).toBe('tenant');
    });

    it('returns null for plain localhost', () => {
      mockLocation({ hostname: 'localhost' });
      expect(getSubdomain()).toBeNull();
    });

    it('returns null for IP addresses like 127.0.0.1', () => {
      mockLocation({ hostname: '127.0.0.1' });
      expect(getSubdomain()).toBeNull();
    });

    it('returns null for prod root desk.abino', () => {
      mockLocation({ hostname: 'desk.abino' });
      expect(getSubdomain()).toBeNull();
    });

    it('returns null for prod root desk.abino.in', () => {
      mockLocation({ hostname: 'desk.abino.in' });
      expect(getSubdomain()).toBeNull();
    });

    it('returns null for www subdomain', () => {
      mockLocation({ hostname: 'www.example.com' });
      expect(getSubdomain()).toBeNull();
    });

    it('supports custom VITE_ROOT_DOMAIN from env', () => {
      const originalEnv = import.meta.env.VITE_ROOT_DOMAIN;
      try {
        import.meta.env.VITE_ROOT_DOMAIN = 'customdesk.org';
        mockLocation({ hostname: 'acme.customdesk.org' });
        expect(getSubdomain()).toBe('acme');

        mockLocation({ hostname: 'customdesk.org' });
        expect(getSubdomain()).toBeNull();
      } finally {
        import.meta.env.VITE_ROOT_DOMAIN = originalEnv;
      }
    });
  });

  describe('buildTenantUrl', () => {
    it('redirects to firmname.localhost with port in dev', () => {
      mockLocation({
        protocol: 'http:',
        hostname: 'localhost',
        port: '5173',
      });
      const url = buildTenantUrl('abino', '/dashboard', 'jwt_test_token');
      expect(url).toBe('http://abino.localhost:5173/dashboard#token=jwt_test_token');
    });

    it('redirects to firmname.desk.abino in prod without port', () => {
      mockLocation({
        protocol: 'https:',
        hostname: 'desk.abino',
        port: '',
      });
      const url = buildTenantUrl('firmname', '/dashboard', 'jwt_test_token');
      expect(url).toBe('https://firmname.desk.abino/dashboard#token=jwt_test_token');
    });

    it('redirects to firmname.desk.abino.in in prod', () => {
      mockLocation({
        protocol: 'https:',
        hostname: 'desk.abino.in',
        port: '',
      });
      const url = buildTenantUrl('firmname', '/dashboard');
      expect(url).toBe('https://firmname.desk.abino.in/dashboard');
    });

    it('handles 127.0.0.1 host by redirecting to firmname.localhost', () => {
      mockLocation({
        protocol: 'http:',
        hostname: '127.0.0.1',
        port: '3000',
      });
      const url = buildTenantUrl('abino', '/');
      expect(url).toBe('http://abino.localhost:3000/');
    });

    it('supports custom VITE_ROOT_DOMAIN for URL building', () => {
      const originalEnv = import.meta.env.VITE_ROOT_DOMAIN;
      try {
        import.meta.env.VITE_ROOT_DOMAIN = 'customdesk.org';
        mockLocation({
          protocol: 'https:',
          hostname: 'customdesk.org',
          port: '',
        });
        const url = buildTenantUrl('acme', '/dashboard');
        expect(url).toBe('https://acme.customdesk.org/dashboard');
      } finally {
        import.meta.env.VITE_ROOT_DOMAIN = originalEnv;
      }
    });
  });

  describe('extractSsoToken', () => {
    it('extracts token from hash and cleans URL', () => {
      let replacedUrl = '';
      window.history.replaceState = (_state, _title, url) => {
        replacedUrl = url as string;
      };

      mockLocation({
        pathname: '/dashboard',
        hash: '#token=secret_hash_token_123',
      });

      const token = extractSsoToken();
      expect(token).toBe('secret_hash_token_123');
      expect(replacedUrl).toBe('/dashboard');
    });

    it('extracts token from search params and cleans URL', () => {
      let replacedUrl = '';
      window.history.replaceState = (_state, _title, url) => {
        replacedUrl = url as string;
      };

      mockLocation({
        pathname: '/dashboard',
        search: '?token=secret_search_token_456',
      });

      const token = extractSsoToken();
      expect(token).toBe('secret_search_token_456');
      expect(replacedUrl).toBe('/dashboard');
    });

    it('returns null if no token is present', () => {
      mockLocation({
        pathname: '/dashboard',
        search: '',
        hash: '',
      });

      expect(extractSsoToken()).toBeNull();
    });
  });
});

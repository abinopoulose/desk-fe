import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSubdomain } from './subdomain';

describe('getSubdomain', () => {
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

  const mockHostname = (hostname: string) => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        hostname,
      },
    });
  };

  it('extracts subdomain from abino.localhost', () => {
    mockHostname('abino.localhost');
    expect(getSubdomain()).toBe('abino');
  });

  it('extracts subdomain from tenant.desk.example.com', () => {
    mockHostname('tenant.desk.example.com');
    expect(getSubdomain()).toBe('tenant');
  });

  it('returns null for plain localhost', () => {
    mockHostname('localhost');
    expect(getSubdomain()).toBeNull();
  });

  it('returns null for IP addresses like 127.0.0.1', () => {
    mockHostname('127.0.0.1');
    expect(getSubdomain()).toBeNull();
  });

  it('returns null for www subdomain', () => {
    mockHostname('www.example.com');
    expect(getSubdomain()).toBeNull();
  });
});

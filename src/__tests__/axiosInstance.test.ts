import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axiosInstance from '../api/axiosInstance';
import MockAdapter from 'axios-mock-adapter';

describe('axiosInstance interceptors', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosInstance);
    localStorage.clear();
    // mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it('adds Authorization header if token is in localStorage', async () => {
    localStorage.setItem('token', 'test-token');
    mock.onGet('/test').reply(200, {});

    const response = await axiosInstance.get('/test');
    expect(response.config.headers.Authorization).toBe('Bearer test-token');
  });

  it('does not add Authorization header if no token', async () => {
    mock.onGet('/test').reply(200, {});

    const response = await axiosInstance.get('/test');
    expect(response.config.headers.Authorization).toBeUndefined();
  });

  it('removes token and redirects to login on 401 response', async () => {
    localStorage.setItem('token', 'stale-token');
    mock.onGet('/protected').reply(401, {});

    try {
      await axiosInstance.get('/protected');
    } catch {
      // Expected to throw
    }

    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('returns response normally on success', async () => {
    mock.onGet('/test').reply(200, { data: 'success' });
    const response = await axiosInstance.get('/test');
    expect(response.data.data).toBe('success');
  });
});

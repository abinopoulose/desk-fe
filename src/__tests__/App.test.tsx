import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { vi } from "vitest";
import { render, screen, cleanup } from '@testing-library/react';
import App from '../App';
vi.mock('../pages/metrics/MetricsDashboardPage', () => ({ MetricsDashboardPage: () => <div>Performance Metrics</div> }));
import { useAuthStore } from '../store/authStore';

describe('App Routing', () => {
  beforeEach(() => {
    window.history.pushState({}, 'Test page', '/');
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1', email: 'a@b.com', fullName: 'A', roles: [] }, token: 'mock-token', privileges: ['METRICS_READ'] });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders dashboard redirect initially and layout', () => {
    render(<App />);
    expect(screen.getByText('Ticket Dashboard')).toBeDefined();
    expect(screen.getByText('Desk App')).toBeDefined();
  });

  it('navigates to tickets', async () => {
    window.history.pushState({}, 'Test page', '/tickets');
    render(<App />);
    expect(screen.getByText('Tickets Placeholder')).toBeDefined();
  });

  it('navigates to admin', async () => {
    window.history.pushState({}, 'Test page', '/admin');
    render(<App />);
    expect(screen.getByText('Admin Placeholder')).toBeDefined();
  });

  it('navigates to metrics', async () => {
    window.history.pushState({}, 'Test page', '/metrics');
    render(<App />);
    expect(screen.getByText('Performance Metrics')).toBeDefined();
  });

  it('renders login page', async () => {
    useAuthStore.setState({ isAuthenticated: false });
    window.history.pushState({}, 'Test page', '/login');
    render(<App />);
    expect(screen.getByText('Sign in to your account')).toBeDefined();
  });
});

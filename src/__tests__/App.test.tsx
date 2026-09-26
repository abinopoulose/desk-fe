import { render, screen } from '@testing-library/react';
import App from '../App';
import { describe, it, expect, beforeEach } from 'vitest';

describe('App Routing', () => {
  beforeEach(() => {
    window.history.pushState({}, 'Test page', '/');
  });

  it('renders dashboard redirect initially and layout', () => {
    render(<App />);
    expect(screen.getByText('DashboardPage Placeholder')).toBeDefined();
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
    expect(screen.getByText('MetricsPage Placeholder')).toBeDefined();
  });

  it('renders login placeholder', async () => {
    window.history.pushState({}, 'Test page', '/login');
    render(<App />);
    expect(screen.getByText('LoginPage Placeholder')).toBeDefined();
  });
});

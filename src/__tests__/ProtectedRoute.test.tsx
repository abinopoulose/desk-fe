import { render, screen, cleanup } from '@testing-library/react';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { MemoryRouter, Routes, Route } from 'react-router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false });
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to login if unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeDefined();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders children if authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true });
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected Content')).toBeDefined();
    expect(screen.queryByText('Login Page')).toBeNull();
  });
});

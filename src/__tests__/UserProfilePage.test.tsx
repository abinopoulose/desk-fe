import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import UserProfilePage from '../pages/user/UserProfilePage';
import { getUserProfile } from '../api/userApi';

vi.mock('../api/userApi', () => ({
  getUserProfile: vi.fn(),
}));

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (userId: string) => {
    render(
      <MemoryRouter initialEntries={[`/users/${userId}/profile`]}>
        <Routes>
          <Route path="/users/:userId/profile" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading skeleton initially', () => {
    (getUserProfile as Mock).mockImplementation(() => new Promise(() => {}));
    renderComponent('1');
    expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders 404 state when user not found', async () => {
    (getUserProfile as Mock).mockRejectedValue({ response: { status: 404 } });
    renderComponent('1');

    await waitFor(() => {
      expect(screen.getByText('User Not Found')).toBeInTheDocument();
    });
  });

  it('renders error state on generic error and allows retry', async () => {
    (getUserProfile as Mock).mockRejectedValue(new Error('Network error'));
    renderComponent('1');

    await waitFor(() => {
      expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
    });

    // test retry
    (getUserProfile as Mock).mockResolvedValue({
      id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      isActive: true,
      roles: [],
      reportees: [],
      manager: null,
    });

    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('renders user profile successfully with manager and reportees', async () => {
    (getUserProfile as Mock).mockResolvedValue({
      id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      title: 'Engineer',
      isActive: true,
      roles: ['ADMIN', 'USER'],
      manager: { id: '2', fullName: 'Jane Manager', email: 'jane@example.com', title: 'Director' },
      reportees: [{ id: '3', fullName: 'Bob Reportee', email: 'bob@example.com', title: 'Junior' }],
    });

    renderComponent('1');

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Engineer')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Manager')).toBeInTheDocument();
    expect(screen.getByText('Bob Reportee')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('USER')).toBeInTheDocument();
  });

  it('renders user profile successfully without manager, reportees and roles', async () => {
    (getUserProfile as Mock).mockResolvedValue({
      id: '1',
      fullName: 'Inactive User',
      email: 'inactive@example.com',
      isActive: false,
      roles: [],
      manager: null,
      reportees: [],
    });

    renderComponent('1');

    await waitFor(() => {
      expect(screen.getByText('Inactive User')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('No Title')).toBeInTheDocument();
      expect(screen.getByText('No manager assigned (Root node)')).toBeInTheDocument();
      expect(screen.getByText('No roles assigned')).toBeInTheDocument();
      expect(screen.getByText('No direct reports')).toBeInTheDocument();
    });
  });
});

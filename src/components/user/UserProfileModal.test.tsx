import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { UserProfileModal } from './UserProfileModal';
import * as userApi from '../../api/userApi';
import type { UserProfileResponse } from '../../types/user';

vi.mock('../../api/userApi', () => ({
  getUserProfile: vi.fn(),
}));

describe('UserProfileModal Component', () => {
  const mockProfile: UserProfileResponse = {
    id: 'user-100',
    displayId: 'EMP-100',
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    title: 'Senior Software Engineer',
    departmentName: 'Engineering',
    roles: ['EMPLOYEE', 'DEVELOPER'],
    isActive: true,
    profilePictureUrl: 'https://example.com/jane.jpg',
    manager: {
      id: 'manager-1',
      displayId: 'EMP-010',
      fullName: 'John Senior',
      email: 'john.senior@example.com',
      title: 'Engineering Director',
      profilePictureUrl: 'https://example.com/john.jpg',
    },
    reportees: [
      {
        id: 'reportee-1',
        displayId: 'EMP-201',
        fullName: 'Alice Junior',
        email: 'alice.junior@example.com',
        title: 'Associate Engineer',
        profilePictureUrl: 'https://example.com/alice.jpg',
      },
      {
        id: 'reportee-2',
        displayId: 'EMP-202',
        fullName: 'Bob Intern',
        email: 'bob.intern@example.com',
        title: 'Engineering Intern',
      },
    ],
  };

  const mockManagerProfile: UserProfileResponse = {
    id: 'manager-1',
    displayId: 'EMP-010',
    fullName: 'John Senior',
    email: 'john.senior@example.com',
    title: 'Engineering Director',
    departmentName: 'Engineering',
    roles: ['MANAGER'],
    isActive: true,
    profilePictureUrl: 'https://example.com/john.jpg',
    manager: null,
    reportees: [
      {
        id: 'user-100',
        displayId: 'EMP-100',
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        title: 'Senior Software Engineer',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when isOpen is false', () => {
    render(<UserProfileModal userId="user-100" isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('teams-profile-modal')).toBeNull();
  });

  it('renders loading state and displays profile details on successful fetch', async () => {
    vi.mocked(userApi.getUserProfile).mockResolvedValue(mockProfile);

    render(<UserProfileModal userId="user-100" isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/loading profile and hierarchy details/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('EMP-100').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Senior Software Engineer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Engineering').length).toBeGreaterThan(0);
      expect(screen.getAllByText('jane.doe@example.com').length).toBeGreaterThan(0);
      expect(screen.getByText('Active')).toBeDefined();
    });
  });

  it('renders Microsoft Teams hierarchy graph with manager, current user, and direct reports', async () => {
    vi.mocked(userApi.getUserProfile).mockResolvedValue(mockProfile);

    render(<UserProfileModal userId="user-100" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      // Hierarchy graph section is visible by default
      expect(screen.getByTestId('hierarchy-graph-section')).toBeDefined();

      // Reports to manager card
      expect(screen.getByTestId('hierarchy-manager-card')).toBeDefined();
      expect(screen.getAllByText('John Senior').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Engineering Director').length).toBeGreaterThan(0);
      expect(screen.getAllByText('john.senior@example.com').length).toBeGreaterThan(0);

      // Currently viewing card
      expect(screen.getByTestId('hierarchy-current-user-card')).toBeDefined();

      // Direct reports list
      expect(screen.getByTestId('hierarchy-reportees-list')).toBeDefined();
      expect(screen.getByText('Alice Junior')).toBeDefined();
      expect(screen.getByText('Bob Intern')).toBeDefined();
    });
  });

  it('navigates to manager in hierarchy and allows going back via Back button', async () => {
    vi.mocked(userApi.getUserProfile).mockImplementation(async (id: string) => {
      if (id === 'manager-1') return mockManagerProfile;
      return mockProfile;
    });

    render(<UserProfileModal userId="user-100" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
    });

    // Click on manager card to navigate up the hierarchy
    const managerCard = screen.getByTestId('hierarchy-manager-card');
    fireEvent.click(managerCard);

    await waitFor(() => {
      // Now viewing John Senior
      expect(screen.getByRole('heading', { name: 'John Senior' })).toBeDefined();
      expect(screen.getByTestId('profile-modal-back-btn')).toBeDefined();
    });

    // Click Back button to return to Jane Doe
    const backBtn = screen.getByTestId('profile-modal-back-btn');
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeDefined();
    });
  });

  it('switches between Organization and Contact & Overview tabs', async () => {
    vi.mocked(userApi.getUserProfile).mockResolvedValue(mockProfile);

    render(<UserProfileModal userId="user-100" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('hierarchy-graph-section')).toBeDefined();
    });

    // Switch to Overview tab
    const overviewTab = screen.getByTestId('tab-overview');
    fireEvent.click(overviewTab);

    await waitFor(() => {
      expect(screen.getByTestId('overview-details-section')).toBeDefined();
      expect(screen.getByText('Contact Info')).toBeDefined();
      expect(screen.getByText('Department & Roles')).toBeDefined();
      expect(screen.getByText('DEVELOPER')).toBeDefined();
    });

    // Switch back to Organization tab
    const orgTab = screen.getByTestId('tab-organization');
    fireEvent.click(orgTab);

    await waitFor(() => {
      expect(screen.getByTestId('hierarchy-graph-section')).toBeDefined();
    });
  });

  it('does not render Send Email link or Copy button in profile modal', async () => {
    vi.mocked(userApi.getUserProfile).mockResolvedValue(mockProfile);

    render(<UserProfileModal userId="user-100" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText('jane.doe@example.com').length).toBeGreaterThan(0);
    });

    expect(screen.queryByRole('link', { name: /send email/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /copy/i })).toBeNull();
  });

  it('closes on Close button click and Escape key press', async () => {
    vi.mocked(userApi.getUserProfile).mockResolvedValue(mockProfile);
    const handleClose = vi.fn();

    render(<UserProfileModal userId="user-100" isOpen={true} onClose={handleClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('teams-profile-modal')).toBeDefined();
    });

    // Close button
    const closeBtn = screen.getByTestId('profile-modal-close-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('displays error message and allows retry on fetch failure', async () => {
    vi.mocked(userApi.getUserProfile)
      .mockRejectedValueOnce(new Error('Network error loading profile'))
      .mockResolvedValueOnce(mockProfile);

    render(<UserProfileModal userId="user-100" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Network error loading profile')).toBeDefined();
    });

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
    });
  });
});

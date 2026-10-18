import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { DepartmentMembersPage } from './DepartmentMembersPage';
import { departmentApi } from '../../api/departmentApi';

vi.mock('../../api/departmentApi');
vi.mock('../../api/employeeApi');

const mockAdminUser = { id: 'admin-1', fullName: 'Super Manager', email: 'admin@abino.in' };
vi.mock('../../store/authStore', () => ({
  useAuth: () => ({
    user: mockAdminUser,
    isSuperAdmin: true,
    hasPrivilege: () => true,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useParams: () => ({ departmentId: 'dept-1' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('DepartmentMembersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('renders members, filters by role and searches by name or email', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'Engineering',
        description: 'Software Eng',
        alphaTags: ['ENG'],
        myRole: 'ADMIN',
        memberCount: 2,
      },
    ]);

    vi.mocked(departmentApi.getDepartmentMembers).mockResolvedValue([
      {
        id: 'dm-1',
        departmentId: 'dept-1',
        userId: 'u-1',
        displayId: 'USER-1',
        fullName: 'Alice Engineer',
        email: 'alice@abino.in',
        role: 'ADMIN',
        joinedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'dm-2',
        departmentId: 'dept-1',
        userId: 'u-2',
        displayId: 'USER-2',
        fullName: 'Bob Developer',
        email: 'bob@techcorp.com',
        role: 'MEMBER',
        joinedAt: '2026-02-01T00:00:00Z',
      },
    ]);

    render(<DepartmentMembersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Engineer')).toBeDefined();
      expect(screen.getByText('Bob Developer')).toBeDefined();
      expect(screen.getByText('alice@abino.in')).toBeDefined();
      expect(screen.getByText('bob@techcorp.com')).toBeDefined();
    });

    // Test search by email
    const searchInput = screen.getByPlaceholderText(/search members by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'techcorp.com' } });

    expect(screen.queryByText('Alice Engineer')).toBeNull();
    expect(screen.getByText('Bob Developer')).toBeDefined();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Alice Engineer')).toBeDefined();

    // Test filter by role
    const roleSelect = screen.getByLabelText(/filter members by role/i);
    fireEvent.change(roleSelect, { target: { value: 'ADMIN' } });

    expect(screen.getByText('Alice Engineer')).toBeDefined();
    expect(screen.queryByText('Bob Developer')).toBeNull();
  });

  it('paginates members list after 50 members', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'Engineering',
        description: 'Software Eng',
        alphaTags: ['ENG'],
        myRole: 'ADMIN',
        memberCount: 55,
      },
    ]);

    // Create 55 members
    const membersList = Array.from({ length: 55 }, (_, i) => ({
      id: `dm-${i + 1}`,
      departmentId: 'dept-1',
      userId: `u-${i + 1}`,
      displayId: `USER-${i + 1}`,
      fullName: `Member Number ${i + 1}`,
      email: `member${i + 1}@abino.in`,
      role: (i === 0 ? 'ADMIN' : 'MEMBER') as 'ADMIN' | 'MEMBER',
      joinedAt: '2026-01-01T00:00:00Z',
    }));

    vi.mocked(departmentApi.getDepartmentMembers).mockResolvedValue(membersList);

    render(<DepartmentMembersPage />);

    await waitFor(() => {
      // First page shows 1 to 50
      expect(screen.getByText('Member Number 1')).toBeDefined();
      expect(screen.getByText('Member Number 50')).toBeDefined();
      // Member 51 is on page 2
      expect(screen.queryByText('Member Number 51')).toBeNull();
      expect(screen.getByText(/showing/i)).toBeDefined();
      expect(screen.getByText(/Page 1 of 2/i)).toBeDefined();
    });

    // Navigate to page 2
    const nextButton = screen.getByTitle('Next page');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Member Number 51')).toBeDefined();
      expect(screen.getByText('Member Number 55')).toBeDefined();
      expect(screen.queryByText('Member Number 1')).toBeNull();
      expect(screen.getByText(/Page 2 of 2/i)).toBeDefined();
    });
  });

  it('allows promoting and demoting members', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'Engineering',
        description: 'Software Eng',
        alphaTags: ['ENG'],
        myRole: 'ADMIN',
        memberCount: 1,
      },
    ]);

    vi.mocked(departmentApi.getDepartmentMembers).mockResolvedValue([
      {
        id: 'dm-1',
        departmentId: 'dept-1',
        userId: 'u-1',
        displayId: 'USER-1',
        fullName: 'Bob Developer',
        email: 'bob@abino.in',
        role: 'MEMBER',
        joinedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    vi.mocked(departmentApi.updateDepartmentMemberRole).mockResolvedValue({} as any);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DepartmentMembersPage />);

    await waitFor(() => {
      expect(screen.getByText('Bob Developer')).toBeDefined();
    });

    const promoteBtn = screen.getByText('Promote');
    fireEvent.click(promoteBtn);

    await waitFor(() => {
      expect(departmentApi.updateDepartmentMemberRole).toHaveBeenCalledWith(
        'dept-1',
        'u-1',
        { role: 'ADMIN' }
      );
    });
  });
});

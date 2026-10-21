import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDepartmentAccess } from './useDepartmentAccess';
import { departmentApi } from '../api/departmentApi';
import { useDepartmentAccessStore } from '../store/departmentAccessStore';

vi.mock('../api/departmentApi');

let mockUser: any = null;
let mockIsSuperAdmin = false;
let mockPrivileges: string[] = [];

vi.mock('../store/authStore', () => ({
  useAuth: () => ({
    user: mockUser,
    isSuperAdmin: mockIsSuperAdmin,
    hasPrivilege: (p: string) => mockIsSuperAdmin || mockPrivileges.includes(p),
  }),
}));

describe('useDepartmentAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDepartmentAccessStore.getState().reset();
    mockUser = null;
    mockIsSuperAdmin = false;
    mockPrivileges = [];
  });

  it('returns hasDepartmentAccess: false when no user is logged in', () => {
    const { result } = renderHook(() => useDepartmentAccess());

    expect(result.current.hasDepartmentAccess).toBe(false);
    expect(result.current.myDepartments).toHaveLength(0);
  });

  it('returns hasDepartmentAccess: true synchronously for admin users', () => {
    mockUser = { id: 'admin-1', email: 'admin@abino.in', roles: ['ADMIN'] };
    mockIsSuperAdmin = true;

    const { result } = renderHook(() => useDepartmentAccess());

    expect(result.current.hasDepartmentAccess).toBe(true);
    expect(result.current.canEditAnyDept).toBe(true);
  });

  it('returns hasDepartmentAccess: true synchronously for users with DEPARTMENT_EDIT privilege', () => {
    mockUser = { id: 'user-manager', email: 'manager@abino.in', roles: ['USER'] };
    mockPrivileges = ['DEPARTMENT_EDIT'];

    const { result } = renderHook(() => useDepartmentAccess());

    expect(result.current.hasDepartmentAccess).toBe(true);
    expect(result.current.canEditAnyDept).toBe(true);
  });

  it('fetches departments and sets hasDepartmentAccess: true when non-admin is in a department', async () => {
    mockUser = { id: 'emp-1', email: 'emp@abino.in', roles: ['EMPLOYEE'] };
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-tech',
        name: 'Technical Support',
        myRole: 'MEMBER',
        memberCount: 3,
      },
    ]);

    const { result } = renderHook(() => useDepartmentAccess());

    await waitFor(() => {
      expect(result.current.hasDepartmentAccess).toBe(true);
      expect(result.current.myDepartments).toHaveLength(1);
    });
  });

  it('fetches departments and keeps hasDepartmentAccess: false when non-admin has 0 departments', async () => {
    mockUser = { id: 'emp-none', email: 'empnone@abino.in', roles: ['EMPLOYEE'] };
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([]);

    const { result } = renderHook(() => useDepartmentAccess());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.hasDepartmentAccess).toBe(false);
    expect(result.current.myDepartments).toHaveLength(0);
  });
});

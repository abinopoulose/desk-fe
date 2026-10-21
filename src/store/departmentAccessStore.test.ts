import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDepartmentAccessStore } from './departmentAccessStore';
import { departmentApi } from '../api/departmentApi';

vi.mock('../api/departmentApi');

describe('departmentAccessStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDepartmentAccessStore.getState().reset();
  });

  it('immediately grants access if canEditAnyDept is true without calling API', async () => {
    const hasAccess = await useDepartmentAccessStore.getState().checkAccess('admin-1', true);

    expect(hasAccess).toBe(true);
    expect(useDepartmentAccessStore.getState().hasDepartmentAccess).toBe(true);
    expect(useDepartmentAccessStore.getState().isInitialized).toBe(true);
    expect(departmentApi.getMyDepartments).not.toHaveBeenCalled();
  });

  it('fetches departments and grants access when non-admin has assigned departments', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'Technical Support',
        alphaTags: ['TECH'],
        myRole: 'MEMBER',
        memberCount: 5,
      },
    ]);

    const hasAccess = await useDepartmentAccessStore.getState().checkAccess('user-1', false);

    expect(hasAccess).toBe(true);
    expect(useDepartmentAccessStore.getState().hasDepartmentAccess).toBe(true);
    expect(useDepartmentAccessStore.getState().myDepartments).toHaveLength(1);
    expect(departmentApi.getMyDepartments).toHaveBeenCalledTimes(1);
  });

  it('denies access when non-admin has 0 assigned departments', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockResolvedValue([]);

    const hasAccess = await useDepartmentAccessStore.getState().checkAccess('user-1', false);

    expect(hasAccess).toBe(false);
    expect(useDepartmentAccessStore.getState().hasDepartmentAccess).toBe(false);
    expect(useDepartmentAccessStore.getState().myDepartments).toHaveLength(0);
    expect(departmentApi.getMyDepartments).toHaveBeenCalledTimes(1);
  });

  it('denies access and resets on API failure for non-admin', async () => {
    vi.mocked(departmentApi.getMyDepartments).mockRejectedValue(new Error('Network error'));

    const hasAccess = await useDepartmentAccessStore.getState().checkAccess('user-1', false);

    expect(hasAccess).toBe(false);
    expect(useDepartmentAccessStore.getState().hasDepartmentAccess).toBe(false);
    expect(useDepartmentAccessStore.getState().myDepartments).toHaveLength(0);
  });

  it('resets state properly when reset() is called', async () => {
    await useDepartmentAccessStore.getState().checkAccess('admin-1', true);
    expect(useDepartmentAccessStore.getState().hasDepartmentAccess).toBe(true);

    useDepartmentAccessStore.getState().reset();
    expect(useDepartmentAccessStore.getState().hasDepartmentAccess).toBe(false);
    expect(useDepartmentAccessStore.getState().isInitialized).toBe(false);
    expect(useDepartmentAccessStore.getState().userId).toBeNull();
  });
});

import { create } from 'zustand';
import { departmentApi } from '../api/departmentApi';
import type { MyDepartmentDTO } from '../types/department';

export interface DepartmentAccessState {
  myDepartments: MyDepartmentDTO[];
  hasDepartmentAccess: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  userId: string | null;
  checkAccess: (userId: string, canEditAnyDept: boolean) => Promise<boolean>;
  reset: () => void;
}

export const useDepartmentAccessStore = create<DepartmentAccessState>((set, get) => ({
  myDepartments: [],
  hasDepartmentAccess: false,
  isLoading: false,
  isInitialized: false,
  userId: null,
  checkAccess: async (userId: string, canEditAnyDept: boolean) => {
    // Admins with department edit privilege or super admin always have department access
    if (canEditAnyDept) {
      set({
        hasDepartmentAccess: true,
        isInitialized: true,
        isLoading: false,
        userId,
      });
      return true;
    }

    // Avoid redundant parallel fetches for the same user
    if (get().isLoading && get().userId === userId) {
      return get().hasDepartmentAccess;
    }

    set({ isLoading: true, userId });
    try {
      const depts = await departmentApi.getMyDepartments();
      const safeDepts = Array.isArray(depts) ? depts : [];
      const hasAccess = safeDepts.length > 0;
      set({
        myDepartments: safeDepts,
        hasDepartmentAccess: hasAccess,
        isInitialized: true,
        isLoading: false,
        userId,
      });
      return hasAccess;
    } catch {
      set({
        myDepartments: [],
        hasDepartmentAccess: false,
        isInitialized: true,
        isLoading: false,
        userId,
      });
      return false;
    }
  },
  reset: () =>
    set({
      myDepartments: [],
      hasDepartmentAccess: false,
      isLoading: false,
      isInitialized: false,
      userId: null,
    }),
}));

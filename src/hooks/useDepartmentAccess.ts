import { useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { useDepartmentAccessStore } from '../store/departmentAccessStore';

export function useDepartmentAccess() {
  const { user, isSuperAdmin, hasPrivilege } = useAuth();
  const canEditAnyDept = Boolean(isSuperAdmin || hasPrivilege('DEPARTMENT_EDIT'));
  const {
    myDepartments,
    hasDepartmentAccess,
    isLoading,
    isInitialized,
    userId,
    checkAccess,
    reset,
  } = useDepartmentAccessStore();

  useEffect(() => {
    if (!user?.id) {
      if (isInitialized) {
        reset();
      }
      return;
    }

    if (!isInitialized || userId !== user.id) {
      checkAccess(user.id, canEditAnyDept);
    }
  }, [user?.id, isInitialized, userId, canEditAnyDept, checkAccess, reset]);

  return {
    hasDepartmentAccess: canEditAnyDept || hasDepartmentAccess,
    myDepartments,
    isLoading,
    isInitialized,
    canEditAnyDept,
    refetch: () => (user?.id ? checkAccess(user.id, canEditAnyDept) : Promise.resolve(false)),
  };
}

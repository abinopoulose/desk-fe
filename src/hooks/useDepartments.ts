import { departmentApi } from '../api/departmentApi';
import type { DepartmentDTO, CreateDepartmentRequest, UpdateDepartmentRequest } from '../types/department';
import { DEFAULT_DEPARTMENT_FORM_VALUES } from '../constants/departmentConstants';
import { useCrud } from './useCrud';

export function useDepartments() {
  const crud = useCrud<DepartmentDTO, typeof DEFAULT_DEPARTMENT_FORM_VALUES>({
    autoFetch: true,
    fetchAll: departmentApi.getAllDepartments,
    create: (data: CreateDepartmentRequest) => departmentApi.createDepartment(data),
    update: (id: string, data: UpdateDepartmentRequest) => departmentApi.updateDepartment(id, data),
    remove: departmentApi.deleteDepartment,
    defaultFormState: DEFAULT_DEPARTMENT_FORM_VALUES,
    mapEntityToFormState: (dept) => ({
      name: dept.name,
      description: dept.description || '',
      managerId: '',
    }),
    mapFormStateToPayload: (formState) => ({
      name: formState.name,
      description: formState.description,
    }),
    getId: (dept) => dept.id,
  });

  return {
    departments: crud.items,
    loading: crud.loading,
    error: crud.error,
    formState: crud.formState,
    setFormField: crud.setFormField,
    isEditing: crud.isEditing,
    startEdit: crud.startEdit,
    cancelEdit: crud.cancelEdit,
    save: crud.save,
    remove: crud.remove,
    refetch: crud.refetch,
  };
}

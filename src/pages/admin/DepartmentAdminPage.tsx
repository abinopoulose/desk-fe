import React, { useEffect, useState } from 'react';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { departmentApi } from '../../api/departmentApi';
import type { DepartmentDTO, CreateDepartmentRequest, UpdateDepartmentRequest } from '../../types/department';

export const DepartmentAdminPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentDTO | null>(null);
  const [formData, setFormData] = useState<{ name: string; description: string }>({ name: '', description: '' });
  
  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentApi.getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDepartments();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dept: DepartmentDTO) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description || '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        const updateData: UpdateDepartmentRequest = { name: formData.name, description: formData.description };
        await departmentApi.updateDepartment(editingDept.id, updateData);
      } else {
        const createData: CreateDepartmentRequest = { name: formData.name, description: formData.description };
        await departmentApi.createDepartment(createData);
      }
      closeModal();
      loadDepartments();
    } catch (error) {
      console.error('Failed to save department', error);
      alert('Failed to save department. Check console for details.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the department "${name}"?`)) {
      try {
        await departmentApi.deleteDepartment(id);
        loadDepartments();
      } catch (error) {
        console.error('Failed to delete department', error);
        alert('Failed to delete department. Check console for details.');
      }
    }
  };

  return (
    <PrivilegeGate requiredPrivilege="DEPARTMENT_WRITE">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Departments Management</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Create Department
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-medium text-gray-600">Name</th>
                  <th className="p-4 font-medium text-gray-600">Description</th>
                  <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{dept.name}</td>
                    <td className="p-4 text-gray-600">{dept.description || '-'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id, dept.name)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      No departments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingDept ? 'Edit Department' : 'Create Department'}
              </h2>
              <form onSubmit={handleSave}>
                <div className="mb-4">
                  <label htmlFor="dept-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="dept-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="dept-desc" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="dept-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border p-2 rounded h-24"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PrivilegeGate>
  );
};

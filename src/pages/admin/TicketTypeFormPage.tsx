import { ROUTES } from '../../constants';
import React from 'react';
import { useNavigate } from 'react-router';
import { SchemaBuilder } from '../../components/admin/SchemaBuilder';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { useTicketTypeForm } from '../../hooks';

export const TicketTypeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isEditMode,
    title,
    setTitle,
    description,
    setDescription,
    folderId,
    setFolderId,
    departmentId,
    setDepartmentId,
    formSchema,
    setFormSchema,
    isActive,
    setIsActive,
    loading,
    submitting,
    error,
    handleSubmit,
  } = useTicketTypeForm();

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <PrivilegeGate requiredPrivilege="TICKET_TYPE_WRITE">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Ticket Type' : 'Create Ticket Type'}
          </h1>
          <button
            onClick={() => navigate(ROUTES.ADMIN.TICKET_TYPES)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to List
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">Title *</label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium mb-1">Department ID *</label>
              <input
                id="departmentId"
                type="text"
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded p-2 h-20"
              />
            </div>
            <div>
              <label htmlFor="folderId" className="block text-sm font-medium mb-1">Folder ID *</label>
              <input
                id="folderId"
                type="text"
                required
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="e.g. IT/Hardware"
              />
            </div>
            <div className="flex items-center h-full pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="isActive" className="font-medium">Active (Available for users)</label>
            </div>
          </div>
        </form>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-6 border-b pb-2">Form Schema Builder</h2>
          <SchemaBuilder schema={formSchema} onChange={setFormSchema} />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Ticket Type'}
          </button>
        </div>
      </div>
    </PrivilegeGate>
  );
};

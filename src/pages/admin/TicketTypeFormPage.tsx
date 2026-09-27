import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import type { FormSchema } from '../../types/formSchema';
import { SchemaBuilder } from '../../components/admin/SchemaBuilder';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';

export const TicketTypeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [formSchema, setFormSchema] = useState<FormSchema>({ fields: [] });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isEditMode && id) {
      ticketTypeApi.getTicketTypeById(id)
        .then(data => {
          setTitle(data.title);
          setDescription(data.description || '');
          setFolderId(data.folderId);
          setDepartmentId(data.departmentId);
          setFormSchema((data.formSchema as unknown as FormSchema) || { fields: [] });
          setIsActive(data.isActive);
        })
        .catch(err => {
          console.error('Error fetching ticket type', err);
          setError('Failed to load ticket type.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title,
        description,
        folderId,
        departmentId,
        formSchema: formSchema as unknown as Record<string, unknown>,
        isActive
      };
      
      if (isEditMode && id) {
        await ticketTypeApi.updateTicketType(id, payload);
      } else {
        await ticketTypeApi.createTicketType(payload);
      }
      navigate('/admin/ticket-types');
    } catch (err) {
      console.error('Error saving ticket type', err);
      setError('Failed to save ticket type. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <PrivilegeGate requiredPrivilege="TICKET_TYPE_WRITE">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Ticket Type' : 'Create Ticket Type'}
          </h1>
          <button
            onClick={() => navigate('/admin/ticket-types')}
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
                onChange={e => setTitle(e.target.value)}
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
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
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
                onChange={e => setFolderId(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="e.g. IT/Hardware"
              />
            </div>
            <div className="flex items-center h-full pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
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

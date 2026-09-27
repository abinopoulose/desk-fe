import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { ticketApi } from '../../api/ticketApi';
import { FormSchemaResponse } from '../../types/ticket';
import { DynamicFormRenderer } from '../../components/forms/DynamicFormRenderer';
import { FormSchema } from '../../types/formSchema';

export const CreateTicketPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeId = searchParams.get('typeId');

  const [schemaResponse, setSchemaResponse] = useState<FormSchemaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [priority, setPriority] = useState<number>(3);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stagedFormData, setStagedFormData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeId) {
      setLoading(true);
      ticketApi.getTicketSchema(typeId)
        .then((res) => {
          setSchemaResponse(res);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load ticket schema');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [typeId]);

  if (!typeId) {
    return (
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-200 rounded p-6 text-center">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Select a Service Request Type</h2>
          <p className="mb-4">Please choose what kind of ticket you'd like to create.</p>
          <Link to="/browse" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Browse Folders
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8" data-testid="loading">Loading schema...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!schemaResponse) {
    return null;
  }

  const handleFormSubmit = (data: Record<string, unknown>) => {
    setStagedFormData(data);
    setShowConfirmModal(true);
  };

  const confirmSubmission = async () => {
    setIsSubmitting(true);
    setFieldErrors({});
    setError(null);
    try {
      const result = await ticketApi.createTicket({
        ticketTypeId: typeId,
        priority,
        formData: stagedFormData,
      });
      navigate(`/tickets/${result.id}`);
    } catch (err: any) {
      setShowConfirmModal(false);
      if (err.response && err.response.status === 400 && err.response.data && err.response.data.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        setError(err.message || 'An error occurred during submission');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded" role="alert">
          {error}
        </div>
      )}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          New Ticket / {schemaResponse.departmentId} / {schemaResponse.folderId}
        </div>
        <h1 className="text-2xl font-bold">{schemaResponse.title}</h1>
        <p className="text-gray-600 mt-1">{schemaResponse.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Priority</h2>
        <div className="flex gap-4">
          {[
            { value: 1, label: 'Critical', colorClass: 'bg-red-100 text-red-800 border-red-200' },
            { value: 2, label: 'High', colorClass: 'bg-orange-100 text-orange-800 border-orange-200' },
            { value: 3, label: 'Medium', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
            { value: 4, label: 'Low', colorClass: 'bg-gray-100 text-gray-800 border-gray-200' },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`px-4 py-2 rounded border ${priority === p.value ? p.colorClass + ' ring-2 ring-offset-2 ring-blue-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              data-testid={`priority-${p.value}`}
            >
              <span className="font-medium">{p.value} - {p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <DynamicFormRenderer
          schema={schemaResponse.formSchema as unknown as FormSchema}
          onSubmit={handleFormSubmit}
          externalErrors={fieldErrors}
          isSubmitting={isSubmitting}
        />
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6" role="dialog" aria-modal="true">
            <h3 className="text-xl font-bold mb-4">Confirm Ticket Details</h3>
            <div className="space-y-4 mb-6">
              <div>
                <span className="font-semibold">Type:</span> {schemaResponse.title}
              </div>
              <div>
                <span className="font-semibold">Priority:</span> {priority}
              </div>
              <div>
                <span className="font-semibold">Details:</span>
                <pre className="bg-gray-50 p-2 mt-2 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(stagedFormData, null, 2)}
                </pre>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSubmission}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                disabled={isSubmitting}
                data-testid="confirm-submit-btn"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

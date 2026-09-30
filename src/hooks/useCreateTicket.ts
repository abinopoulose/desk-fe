import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { ticketApi } from '../api/ticketApi';
import type { FormSchemaResponse } from '../types/ticket';

export function useCreateTicket() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeId = searchParams.get('typeId');

  const [schemaResponse, setSchemaResponse] = useState<FormSchemaResponse | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [priority, setPriority] = useState<number>(3);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stagedFormData, setStagedFormData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingSchema(true);
      ticketApi
        .getTicketSchema(typeId)
        .then((res) => {
          setSchemaResponse(res);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load ticket schema');
        })
        .finally(() => {
          setLoadingSchema(false);
        });
    }
  }, [typeId]);

  const handleFormSubmit = (data: Record<string, unknown>) => {
    setStagedFormData(data);
    setShowConfirmModal(true);
  };

  const confirmSubmission = async () => {
    if (!typeId) return;
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
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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

  return {
    typeId,
    schemaResponse,
    loadingSchema,
    error,
    fieldErrors,
    priority,
    setPriority,
    isSubmitting,
    showConfirmModal,
    setShowConfirmModal,
    stagedFormData,
    handleFormSubmit,
    confirmSubmission,
  };
}

import type { ApiError } from '../utils/apiErrorHandler';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { ticketApi } from '../api/ticketApi';
import { ROUTES } from '../constants';
import type { FormSchemaResponse } from '../types/ticket';

export function useCreateTicket() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeId = searchParams.get('typeId');

  const [schemaResponse, setSchemaResponse] = useState<FormSchemaResponse | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
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
    if (!title.trim()) {
      setTitleError('Ticket title is required');
      return;
    }
    setTitleError(null);
    setStagedFormData(data);
    setShowConfirmModal(true);
  };

  const confirmSubmission = async () => {
    if (!typeId) return;
    if (!title.trim()) {
      setTitleError('Ticket title is required');
      setShowConfirmModal(false);
      return;
    }
    setIsSubmitting(true);
    setFieldErrors({});
    setError(null);
    try {
      const result = await ticketApi.createTicket({
        ticketTypeId: typeId,
        title: title.trim(),
        priority,
        formData: stagedFormData,
      });
      navigate(ROUTES.TICKETS.DETAILS(result.displayId || result.id));
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setShowConfirmModal(false);
      if (apiErr.statusCode === 400 && apiErr.details) {
        setFieldErrors(apiErr.details as Record<string, string>);
      } else {
        setError(apiErr.message || 'An error occurred during submission');
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
    title,
    setTitle,
    titleError,
    setTitleError,
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

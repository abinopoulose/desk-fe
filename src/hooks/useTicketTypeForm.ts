import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { ticketTypeApi } from '../api/ticketTypeApi';
import type { FormSchema } from '../types/formSchema';
import type { TicketTypeDTO } from '../types/ticket';
import { ROUTES, DEFAULT_TICKET_TYPE_VALUES } from '../constants';
import { normalizeFormSchema } from './useSchemaBuilder';

export interface TicketTypeFormData {
  title: string;
  description: string;
  folderId: string;
  departmentId: string;
  alphaTag: string;
  formSchema: FormSchema;
  isActive: boolean;
}

export interface UseTicketTypeFormOptions {
  ticketTypeId?: string;
  onSuccess?: (ticketType: TicketTypeDTO) => Promise<void> | void;
}

export function useTicketTypeForm(options?: UseTicketTypeFormOptions | string) {
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const explicitId = typeof options === 'string' ? options : options?.ticketTypeId;
  const ticketTypeId = explicitId ?? params?.id;
  const isEditMode = Boolean(ticketTypeId);
  const searchFolderId = searchParams.get('folderId') || '';

  const [formData, setFormData] = useState<TicketTypeFormData>({
    title: DEFAULT_TICKET_TYPE_VALUES.title,
    description: DEFAULT_TICKET_TYPE_VALUES.description,
    folderId: searchFolderId || DEFAULT_TICKET_TYPE_VALUES.folderId,
    departmentId: DEFAULT_TICKET_TYPE_VALUES.departmentId,
    alphaTag: DEFAULT_TICKET_TYPE_VALUES.alphaTag || '',
    formSchema: normalizeFormSchema(DEFAULT_TICKET_TYPE_VALUES.formSchema),
    isActive: DEFAULT_TICKET_TYPE_VALUES.isActive,
  });

  const [originalAlphaTag, setOriginalAlphaTag] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isEditMode && ticketTypeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      setError(null);
      ticketTypeApi
        .getTicketTypeById(ticketTypeId)
        .then((data) => {
          setFormData({
            title: data.title,
            description: data.description || '',
            folderId: data.folderId,
            departmentId: data.departmentId,
            alphaTag: data.alphaTag || '',
            formSchema: normalizeFormSchema(data.formSchema),
            isActive: data.isActive ?? data.active ?? false,
          });
          setOriginalAlphaTag(data.alphaTag || '');
        })
        .catch((err: unknown) => {
          console.error('Error fetching ticket type', err);
          setError('Failed to load ticket type.');
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, ticketTypeId]);

  const setFormField = useCallback(<K extends keyof TicketTypeFormData>(field: K, value: TicketTypeFormData[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const setTitle = useCallback((title: string) => setFormField('title', title), [setFormField]);
  const setDescription = useCallback((description: string) => setFormField('description', description), [setFormField]);
  const setFolderId = useCallback((folderId: string) => setFormField('folderId', folderId), [setFormField]);
  const setDepartmentId = useCallback((departmentId: string) => setFormField('departmentId', departmentId), [setFormField]);
  const setAlphaTag = useCallback((alphaTag: string) => setFormField('alphaTag', alphaTag), [setFormField]);
  const setFormSchema = useCallback((formSchema: FormSchema) => setFormField('formSchema', formSchema), [setFormField]);
  const setIsActive = useCallback((isActive: boolean) => setFormField('isActive', isActive), [setFormField]);

  const onSuccess = typeof options === 'object' ? options?.onSuccess : undefined;

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<TicketTypeDTO | null> => {
      e?.preventDefault();
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      try {
        const payload = {
          title: formData.title,
          description: formData.description,
          folderId: formData.folderId,
          departmentId: formData.departmentId,
          alphaTag: formData.alphaTag,
          formSchema: formData.formSchema as unknown as Record<string, unknown>,
          isActive: formData.isActive,
          active: formData.isActive,
        };

        let result: TicketTypeDTO;
        if (isEditMode && ticketTypeId) {
          result = await ticketTypeApi.updateTicketType(ticketTypeId, payload);
        } else {
          result = await ticketTypeApi.createTicketType(payload);
        }

        setSuccess(true);
        if (onSuccess) {
          await onSuccess(result);
        } else {
          navigate(ROUTES.ADMIN.TICKET_TYPES);
        }
        return result;
      } catch (err: unknown) {
        console.error('Error saving ticket type', err);
        setError('Failed to save ticket type. Please try again.');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [formData, isEditMode, ticketTypeId, onSuccess, navigate]
  );

  return {
    ticketTypeId,
    isEditMode,
    formData,
    setFormData,
    setFormField,
    title: formData.title,
    description: formData.description,
    folderId: formData.folderId,
    departmentId: formData.departmentId,
    alphaTag: formData.alphaTag,
    originalAlphaTag,
    formSchema: formData.formSchema,
    isActive: formData.isActive,
    setTitle,
    setDescription,
    setFolderId,
    setDepartmentId,
    setAlphaTag,
    setFormSchema,
    setIsActive,
    loading,
    submitting,
    isSubmitting: submitting,
    error,
    setError,
    success,
    handleSubmit,
    save: handleSubmit,
    resetForm: () =>
      setFormData({
        title: DEFAULT_TICKET_TYPE_VALUES.title,
        description: DEFAULT_TICKET_TYPE_VALUES.description,
        folderId: searchFolderId || DEFAULT_TICKET_TYPE_VALUES.folderId,
        departmentId: DEFAULT_TICKET_TYPE_VALUES.departmentId,
        alphaTag: DEFAULT_TICKET_TYPE_VALUES.alphaTag || '',
        formSchema: normalizeFormSchema(DEFAULT_TICKET_TYPE_VALUES.formSchema),
        isActive: DEFAULT_TICKET_TYPE_VALUES.isActive,
      }),
  };
}


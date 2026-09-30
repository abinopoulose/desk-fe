import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ApiError } from '../utils/apiErrorHandler';

export interface UseCrudOptions<T, FormStateT> {
  autoFetch?: boolean;
  fetchAll: () => Promise<T[]>;
  create: (payload: any) => Promise<T>;
  update: (id: string, payload: any) => Promise<T>;
  remove: (id: string) => Promise<void>;
  defaultFormState: FormStateT;
  mapEntityToFormState?: (entity: T) => FormStateT;
  mapFormStateToPayload?: (formState: FormStateT, isEditing: boolean) => any;
  getId: (entity: T) => string;
}

export function useCrud<T, FormStateT>({
  autoFetch = false,
  fetchAll,
  create,
  update,
  remove: removeApi,
  defaultFormState,
  mapEntityToFormState,
  mapFormStateToPayload,
  getId,
}: UseCrudOptions<T, FormStateT>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<FormStateT>(defaultFormState);

  const fetchAllRef = useRef(fetchAll);
  useEffect(() => {
    fetchAllRef.current = fetchAll;
  }, [fetchAll]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllRef.current();
      setItems(data);
      return data;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to fetch items';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      void refetch().catch(() => {});
    }
  }, [autoFetch, refetch]);

  const setFormField = useCallback((field: keyof FormStateT, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const startEdit = useCallback((item?: T | null) => {
    if (item) {
      setEditingItem(item);
      setIsEditing(true);
      setFormState(mapEntityToFormState ? mapEntityToFormState(item) : (item as unknown as FormStateT));
    } else {
      setEditingItem(null);
      setIsEditing(false);
      setFormState(defaultFormState);
    }
    setIsModalOpen(true);
  }, [defaultFormState, mapEntityToFormState]);

  const cancelEdit = useCallback(() => {
    setEditingItem(null);
    setIsEditing(false);
    setFormState(defaultFormState);
    setIsModalOpen(false);
  }, [defaultFormState]);

  const save = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = mapFormStateToPayload ? mapFormStateToPayload(formState, isEditing) : (formState as any);
      let result;
      if (isEditing && editingItem) {
        result = await update(getId(editingItem), payload);
      } else {
        result = await create(payload);
      }
      cancelEdit();
      await refetch();
      return result;
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to save item';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isEditing, editingItem, formState, mapFormStateToPayload, update, getId, create, cancelEdit, refetch]);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await removeApi(id);
      await refetch();
    } catch (err: unknown) {
      const message = (err as ApiError)?.message || 'Failed to delete item';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [removeApi, refetch]);

  return {
    items,
    loading,
    error,
    formState,
    setFormField,
    setFormState,
    setItems,
    setLoading,
    setError,
    isEditing,
    isModalOpen,
    editingItem,
    startEdit,
    cancelEdit,
    save,
    remove,
    refetch,
  };
}

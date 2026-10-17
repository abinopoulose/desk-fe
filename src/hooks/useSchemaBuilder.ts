import { useReducer, useCallback, useMemo } from 'react';
import type { FormSchema, FormField, FieldType } from '../types/formSchema';

export const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: 'Short Text', value: 'text' },
  { label: 'Paragraph / Long Text', value: 'textarea' },
  { label: 'Dropdown List', value: 'select' },
  { label: 'Checkbox (Yes / No)', value: 'checkbox' },
  { label: 'Number', value: 'number' },
  { label: 'Date', value: 'date' },
];

export const VALIDATION_RULE_OPTIONS = [
  { label: 'Required', value: 'required' },
  { label: 'Min Length', value: 'minLength' },
  { label: 'Max Length', value: 'maxLength' },
  { label: 'Min', value: 'min' },
  { label: 'Max', value: 'max' },
];

type Action =
  | { type: 'ADD_FIELD'; field: FormField; insertAtIndex?: number }
  | { type: 'DUPLICATE_FIELD'; index: number }
  | { type: 'REMOVE_FIELD'; index: number }
  | { type: 'REORDER_FIELD'; startIndex: number; endIndex: number }
  | { type: 'UPDATE_FIELD'; index: number; updates: Partial<FormField> }
  | { type: 'SET_VALIDATION'; index: number; validation: Partial<FormField> }
  | { type: 'SELECT_FIELD'; index: number | null }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'SET_DRAGGED_INDEX'; index: number | null }
  | { type: 'LOAD_SCHEMA'; schema: FormSchema };

interface State {
  schema: FormSchema;
  selectedIndex: number | null;
  isPreview: boolean;
  draggedIndex: number | null;
}

export const normalizeFormSchema = (raw?: unknown): FormSchema => {
  if (!raw) return { fields: [] };
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { fields: [] };
    }
  }
  if (Array.isArray(parsed)) {
    return { fields: parsed as FormField[] };
  }
  if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    const fields = Array.isArray(obj.fields) ? (obj.fields as FormField[]) : [];
    return { ...obj, fields };
  }
  return { fields: [] };
};

const reducer = (state: State, action: Action): State => {
  const currentFields = Array.isArray(state.schema?.fields) ? state.schema.fields : [];
  switch (action.type) {
    case 'ADD_FIELD': {
      const newFields = [...currentFields];
      const insertAt =
        typeof action.insertAtIndex === 'number' &&
        action.insertAtIndex >= 0 &&
        action.insertAtIndex <= currentFields.length
          ? action.insertAtIndex
          : currentFields.length;
      newFields.splice(insertAt, 0, action.field);
      return {
        ...state,
        schema: { ...state.schema, fields: newFields },
        selectedIndex: insertAt,
      };
    }
    case 'DUPLICATE_FIELD': {
      if (action.index < 0 || action.index >= currentFields.length) return state;
      const target = currentFields[action.index];
      const slug = (target.label || 'field')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 16);
      const duplicate: FormField = {
        ...target,
        name: `${slug || 'field'}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        options: target.options ? [...target.options] : undefined,
      };
      const newFields = [...currentFields];
      newFields.splice(action.index + 1, 0, duplicate);
      return {
        ...state,
        schema: { ...state.schema, fields: newFields },
        selectedIndex: action.index + 1,
      };
    }
    case 'REMOVE_FIELD': {
      const newFields = [...currentFields];
      newFields.splice(action.index, 1);
      let newSelectedIndex = state.selectedIndex;
      if (newSelectedIndex === action.index) {
        newSelectedIndex = null;
      } else if (newSelectedIndex !== null && newSelectedIndex > action.index) {
        if (newSelectedIndex !== null) newSelectedIndex--;
      }
      return {
        ...state,
        schema: { ...state.schema, fields: newFields },
        selectedIndex: newSelectedIndex,
      };
    }
    case 'REORDER_FIELD': {
      const newFields = [...currentFields];
      const [removed] = newFields.splice(action.startIndex, 1);
      newFields.splice(action.endIndex, 0, removed);
      
      let newSelectedIndex = state.selectedIndex;
      if (state.selectedIndex === action.startIndex) {
        newSelectedIndex = action.endIndex;
      } else if (
        state.selectedIndex !== null &&
        action.startIndex < state.selectedIndex &&
        action.endIndex >= state.selectedIndex
      ) {
        if (newSelectedIndex !== null) newSelectedIndex--;
      } else if (
        state.selectedIndex !== null &&
        action.startIndex > state.selectedIndex &&
        action.endIndex <= state.selectedIndex
      ) {
        if (newSelectedIndex !== null) newSelectedIndex++;
      }
      
      return {
        ...state,
        schema: { ...state.schema, fields: newFields },
        selectedIndex: newSelectedIndex,
      };
    }
    case 'UPDATE_FIELD': {
      const newFields = [...currentFields];
      newFields[action.index] = { ...newFields[action.index], ...action.updates };
      return {
        ...state,
        schema: { ...state.schema, fields: newFields },
      };
    }
    case 'SET_VALIDATION': {
      const newFields = [...currentFields];
      newFields[action.index] = { ...newFields[action.index], ...action.validation };
      return {
        ...state,
        schema: { ...state.schema, fields: newFields },
      };
    }
    case 'SELECT_FIELD':
      return { ...state, selectedIndex: action.index };
    case 'TOGGLE_PREVIEW':
      return { ...state, isPreview: !state.isPreview };
    case 'SET_DRAGGED_INDEX':
      return { ...state, draggedIndex: action.index };
    case 'LOAD_SCHEMA': {
      const normalized = normalizeFormSchema(action.schema);
      if (JSON.stringify(normalized) === JSON.stringify(state.schema)) {
        return state;
      }
      return { ...state, schema: normalized, selectedIndex: null };
    }
    default:
      return state;
  }
};

export const useSchemaBuilder = (initialSchema?: FormSchema) => {
  const [state, dispatch] = useReducer(reducer, {
    schema: normalizeFormSchema(initialSchema),
    selectedIndex: null,
    isPreview: false,
    draggedIndex: null,
  });

  const addField = useCallback((fieldType: FieldType = 'text', customLabel?: string, insertAtIndex?: number) => {
    const defaultLabels: Record<FieldType, string> = {
      text: 'Short Text Question',
      textarea: 'Detailed Explanation',
      select: 'Dropdown Question',
      checkbox: 'Confirmation Checkbox',
      number: 'Numeric Value',
      date: 'Date Selection',
    };
    const label = customLabel || defaultLabels[fieldType] || 'New Question';
    const slug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 16);
    const newField: FormField = {
      name: `${slug || 'field'}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      label,
      type: fieldType,
      options: fieldType === 'select' ? ['Option 1', 'Option 2'] : undefined,
    };
    dispatch({ type: 'ADD_FIELD', field: newField, insertAtIndex });
  }, []);

  const duplicateField = useCallback((index: number) => {
    dispatch({ type: 'DUPLICATE_FIELD', index });
  }, []);

  const removeField = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_FIELD', index });
  }, []);

  const reorderField = useCallback((startIndex: number, endIndex: number) => {
    dispatch({ type: 'REORDER_FIELD', startIndex, endIndex });
  }, []);

  const updateField = useCallback((index: number, updates: Partial<FormField>) => {
    dispatch({ type: 'UPDATE_FIELD', index, updates });
  }, []);

  const setValidation = useCallback((index: number, validation: Partial<FormField>) => {
    dispatch({ type: 'SET_VALIDATION', index, validation });
  }, []);

  const selectField = useCallback((index: number | null) => {
    dispatch({ type: 'SELECT_FIELD', index });
  }, []);

  const togglePreview = useCallback(() => {
    dispatch({ type: 'TOGGLE_PREVIEW' });
  }, []);

  const dragHandlers = useMemo(
    () => ({
      onDragStart: (index: number) => {
        dispatch({ type: 'SET_DRAGGED_INDEX', index });
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
      },
      onDrop: (index: number) => {
        if (state.draggedIndex !== null && state.draggedIndex !== index) {
          dispatch({ type: 'REORDER_FIELD', startIndex: state.draggedIndex, endIndex: index });
        }
        dispatch({ type: 'SET_DRAGGED_INDEX', index: null });
      },
    }),
    [state.draggedIndex]
  );

  const loadSchema = useCallback((schema: FormSchema) => {
    dispatch({ type: 'LOAD_SCHEMA', schema });
  }, []);

  const safeFields = Array.isArray(state.schema?.fields) ? state.schema.fields : [];

  return {
    schema: state.schema,
    fields: safeFields,
    selectedField: state.selectedIndex !== null && safeFields[state.selectedIndex] ? safeFields[state.selectedIndex] : null,
    selectedIndex: state.selectedIndex,
    selectField,
    addField,
    duplicateField,
    removeField,
    reorderField,
    updateField,
    setValidation,
    loadSchema,
    isPreview: state.isPreview,
    togglePreview,
    dragHandlers,
  };
};

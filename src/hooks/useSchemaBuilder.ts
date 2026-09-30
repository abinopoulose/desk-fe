import { useReducer, useCallback } from 'react';
import type { FormSchema, FormField, FieldType } from '../types/formSchema';

export const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Select', value: 'select' },
  { label: 'Checkbox', value: 'checkbox' },
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
  | { type: 'ADD_FIELD'; field: FormField }
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

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_FIELD':
      return {
        ...state,
        schema: { fields: [...state.schema.fields, action.field] },
        selectedIndex: state.schema.fields.length,
      };
    case 'REMOVE_FIELD': {
      const newFields = [...state.schema.fields];
      newFields.splice(action.index, 1);
      let newSelectedIndex = state.selectedIndex;
      if (newSelectedIndex === action.index) {
        newSelectedIndex = null;
      } else if (newSelectedIndex !== null && newSelectedIndex > action.index) {
        if (newSelectedIndex !== null) newSelectedIndex--;
      }
      return {
        ...state,
        schema: { fields: newFields },
        selectedIndex: newSelectedIndex,
      };
    }
    case 'REORDER_FIELD': {
      const newFields = [...state.schema.fields];
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
        schema: { fields: newFields },
        selectedIndex: newSelectedIndex,
      };
    }
    case 'UPDATE_FIELD': {
      const newFields = [...state.schema.fields];
      newFields[action.index] = { ...newFields[action.index], ...action.updates };
      return {
        ...state,
        schema: { fields: newFields },
      };
    }
    case 'SET_VALIDATION': {
      const newFields = [...state.schema.fields];
      newFields[action.index] = { ...newFields[action.index], ...action.validation };
      return {
        ...state,
        schema: { fields: newFields },
      };
    }
    case 'SELECT_FIELD':
      return { ...state, selectedIndex: action.index };
    case 'TOGGLE_PREVIEW':
      return { ...state, isPreview: !state.isPreview };
    case 'SET_DRAGGED_INDEX':
      return { ...state, draggedIndex: action.index };
    case 'LOAD_SCHEMA':
      return { ...state, schema: action.schema, selectedIndex: null };
    default:
      return state;
  }
};

export const useSchemaBuilder = (initialSchema?: FormSchema) => {
  const [state, dispatch] = useReducer(reducer, {
    schema: initialSchema || { fields: [] },
    selectedIndex: null,
    isPreview: false,
    draggedIndex: null,
  });

  const addField = useCallback(() => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
    };
    dispatch({ type: 'ADD_FIELD', field: newField });
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

  const dragHandlers = {
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
  };

  return {
    schema: state.schema,
    fields: state.schema.fields,
    selectedField: state.selectedIndex !== null ? state.schema.fields[state.selectedIndex] : null,
    selectedIndex: state.selectedIndex,
    selectField,
    addField,
    removeField,
    reorderField,
    updateField,
    setValidation,
    isPreview: state.isPreview,
    togglePreview,
    dragHandlers,
  };
};

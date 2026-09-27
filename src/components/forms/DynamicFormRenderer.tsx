import React, { useState, useEffect } from 'react';
import { FormSchema, FormField } from '../../types/formSchema';
import { TextField } from './fields/TextField';
import { TextAreaField } from './fields/TextAreaField';
import { SelectField } from './fields/SelectField';
import { CheckboxField } from './fields/CheckboxField';
import { NumberField } from './fields/NumberField';
import { DateField } from './fields/DateField';

export interface DynamicFormRendererProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
  isSubmitting?: boolean;
  externalErrors?: Record<string, string>;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  schema,
  onSubmit,
  initialData = {},
  isSubmitting = false,
  externalErrors = {},
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(initialData);
    setErrors({});
  }, [initialData, schema]);

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return 'This field is required';
    }
    
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        if (field.minLength !== undefined && value.length < field.minLength) {
          return `Minimum length is ${field.minLength}`;
        }
        if (field.maxLength !== undefined && value.length > field.maxLength) {
          return `Maximum length is ${field.maxLength}`;
        }
      }
      
      if (typeof value === 'number') {
        if (field.min !== undefined && value < field.min) {
          return `Minimum value is ${field.min}`;
        }
        if (field.max !== undefined && value > field.max) {
          return `Maximum value is ${field.max}`;
        }
      }
    }
    
    return null;
  };

  const isFieldVisible = (field: FormField): boolean => {
    if (!field.conditionalOn) return true;
    const { field: depField, value: depValue } = field.conditionalOn;
    return values[depField] === depValue;
  };

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error when user changes value
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    const submitData: Record<string, unknown> = {};
    let hasErrors = false;

    schema.fields.forEach((field) => {
      if (isFieldVisible(field)) {
        const error = validateField(field, values[field.name]);
        if (error) {
          newErrors[field.name] = error;
          hasErrors = true;
        } else {
          submitData[field.name] = values[field.name];
        }
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    onSubmit(submitData);
  };

  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null;

    const props = {
      key: field.name,
      field,
      value: values[field.name],
      onChange: (val: any) => handleChange(field.name, val),
      error: errors[field.name] || externalErrors[field.name],
    };

    switch (field.type) {
      case 'text':
        return <TextField {...props} />;
      case 'textarea':
        return <TextAreaField {...props} />;
      case 'select':
        return <SelectField {...props} />;
      case 'checkbox':
        return <CheckboxField {...props} />;
      case 'number':
        return <NumberField {...props} />;
      case 'date':
        return <DateField {...props} />;
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {schema.fields.map(renderField)}
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

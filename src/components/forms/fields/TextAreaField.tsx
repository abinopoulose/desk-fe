import React from 'react';
import type { FieldProps } from './types';

export const TextAreaField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  const currentLength = typeof value === 'string' ? value.length : 0;
  
  return (
    <div className="mb-4">
      <label htmlFor={field.name} className="block text-sm font-medium mb-1">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={field.name}
        name={field.name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
        rows={4}
      />
      <div className="flex justify-between items-center text-sm mt-1">
        <span className="text-gray-500">
          {field.maxLength ? `${currentLength} / ${field.maxLength}` : `${currentLength} chars`}
        </span>
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  );
};

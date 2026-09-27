import React from 'react';
import { FieldProps } from './types';

export const TextField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  return (
    <div className="mb-4">
      <label htmlFor={field.name} className="block text-sm font-medium mb-1">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={field.name}
        type="text"
        name={field.name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

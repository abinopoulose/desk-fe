import React from 'react';
import { FieldProps } from './types';

export const SelectField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  return (
    <div className="mb-4">
      <label htmlFor={field.name} className="block text-sm font-medium mb-1">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={field.name}
        name={field.name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border rounded bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}
      >
        <option value="">Select an option</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

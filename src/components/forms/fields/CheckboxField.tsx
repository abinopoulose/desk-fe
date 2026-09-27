import React from 'react';
import type { FieldProps } from './types';

export const CheckboxField: React.FC<FieldProps> = ({ field, value, onChange, error }) => {
  return (
    <div className="mb-4">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          name={field.name}
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </span>
      </label>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

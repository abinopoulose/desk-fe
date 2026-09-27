import React, { useState } from 'react';
import type { FormSchema, FormField, FieldType } from '../../types/formSchema';
import { DynamicFormRenderer } from '../forms/DynamicFormRenderer';

export interface SchemaBuilderProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
}

export const SchemaBuilder: React.FC<SchemaBuilderProps> = ({ schema, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
    };
    onChange({ fields: [...schema.fields, newField] });
    setEditingIndex(schema.fields.length);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...schema.fields];
    newFields.splice(index, 1);
    onChange({ fields: newFields });
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === schema.fields.length - 1) return;

    const newFields = [...schema.fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    
    onChange({ fields: newFields });
    if (editingIndex === index) {
      setEditingIndex(swapIndex);
    } else if (editingIndex === swapIndex) {
      setEditingIndex(index);
    }
  };

  const handleUpdateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...schema.fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange({ fields: newFields });
  };

  const handleUpdateOptions = (index: number, optionsString: string) => {
    const options = optionsString.split(',').map(s => s.trim()).filter(s => s);
    handleUpdateField(index, { options });
  };

  const activeField = editingIndex !== null ? schema.fields[editingIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Schema Editor Side */}
      <div className="border rounded p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Fields</h3>
          <button
            type="button"
            onClick={handleAddField}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            + Add Field
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {schema.fields.map((field, index) => (
            <div 
              key={index}
              className={`p-3 border rounded flex justify-between items-center cursor-pointer ${editingIndex === index ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}
              onClick={() => setEditingIndex(index)}
            >
              <div>
                <span className="font-medium">{field.label}</span>
                <span className="text-xs text-gray-500 ml-2">({field.name}) - {field.type}</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleMoveField(index, 'up'); }}
                  disabled={index === 0}
                  className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs"
                >
                  ↑
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleMoveField(index, 'down'); }}
                  disabled={index === schema.fields.length - 1}
                  className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs"
                >
                  ↓
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveField(index); }}
                  className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {schema.fields.length === 0 && (
            <p className="text-gray-500 text-center py-4">No fields added yet.</p>
          )}
        </div>

        {activeField && editingIndex !== null && (
          <div className="p-4 border border-blue-200 rounded bg-white mt-4">
            <h4 className="font-bold mb-4">Edit Field: {activeField.name}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name (Key)</label>
                <input
                  type="text"
                  value={activeField.name}
                  onChange={(e) => handleUpdateField(editingIndex, { name: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  value={activeField.label}
                  onChange={(e) => handleUpdateField(editingIndex, { label: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={activeField.type}
                  onChange={(e) => handleUpdateField(editingIndex, { type: e.target.value as FieldType })}
                  className="w-full border rounded p-2 text-sm"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>

              {activeField.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Options (comma separated)</label>
                  <input
                    type="text"
                    value={activeField.options?.join(', ') || ''}
                    onChange={(e) => handleUpdateOptions(editingIndex, e.target.value)}
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`required_${editingIndex}`}
                  checked={!!activeField.required}
                  onChange={(e) => handleUpdateField(editingIndex, { required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor={`required_${editingIndex}`} className="text-sm">Required Field</label>
              </div>

              {/* Conditional Logic (simplified for brevity) */}
              <div className="pt-2 border-t border-gray-200 mt-2">
                <label className="block text-sm font-medium mb-1 text-gray-700">Conditional Display</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={activeField.conditionalOn?.field || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateField(editingIndex, { 
                        conditionalOn: val ? { field: val, value: activeField.conditionalOn?.value || '' } : undefined 
                      });
                    }}
                    className="flex-1 border rounded p-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Value to match"
                    value={(activeField.conditionalOn?.value as string) || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (activeField.conditionalOn?.field) {
                         handleUpdateField(editingIndex, { 
                           conditionalOn: { field: activeField.conditionalOn.field, value: val }
                         });
                      }
                    }}
                    className="flex-1 border rounded p-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Side */}
      <div className="border rounded p-4 bg-white">
        <h3 className="text-lg font-bold mb-4 border-b pb-2">Form Preview</h3>
        {schema.fields.length > 0 ? (
          <DynamicFormRenderer 
            schema={schema} 
            onSubmit={(data) => console.log('Preview submit:', data)} 
          />
        ) : (
          <p className="text-gray-500 italic text-center py-8">Add fields to see preview.</p>
        )}
      </div>
    </div>
  );
};

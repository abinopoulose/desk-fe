import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SchemaBuilder } from '../components/admin/SchemaBuilder';
import type { FormSchema } from '../types/formSchema';

describe('SchemaBuilder', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders correctly with empty schema', () => {
    const onChange = vi.fn();
    render(<SchemaBuilder schema={{ fields: [] }} onChange={onChange} />);
    expect(screen.getByText('No fields added yet.')).toBeInTheDocument();
  });

  it('can add a new field', () => {
    const onChange = vi.fn();
    render(<SchemaBuilder schema={{ fields: [] }} onChange={onChange} />);
    
    fireEvent.click(screen.getByText('+ Add Field'));
    
    expect(onChange).toHaveBeenCalledTimes(1);
    const newSchema = onChange.mock.calls[0][0] as FormSchema;
    expect(newSchema.fields.length).toBe(1);
    expect(newSchema.fields[0].label).toBe('New Field');
  });

  it('can edit a field', () => {
    const schema: FormSchema = {
      fields: [
        { name: 'field1', label: 'Field 1', type: 'text' }
      ]
    };
    const onChange = vi.fn();
    render(<SchemaBuilder schema={schema} onChange={onChange} />);
    
    // Click on the field to open editor (use getAllByText since label appears in both list and preview)
    const fieldLabels = screen.getAllByText('Field 1');
    fireEvent.click(fieldLabels[0]);
    
    // Change label — target the input with the current value
    const labelInputs = screen.getAllByDisplayValue('Field 1');
    fireEvent.change(labelInputs[0], { target: { value: 'Updated Label' } });
    
    expect(onChange).toHaveBeenCalledTimes(1);
    const newSchema = onChange.mock.calls[0][0] as FormSchema;
    expect(newSchema.fields[0].label).toBe('Updated Label');
  });

  it('can remove a field', () => {
    const schema: FormSchema = {
      fields: [
        { name: 'field1', label: 'Field 1', type: 'text' }
      ]
    };
    const onChange = vi.fn();
    render(<SchemaBuilder schema={schema} onChange={onChange} />);
    
    const removeBtns = screen.getAllByText('✕');
    fireEvent.click(removeBtns[0]);
    
    expect(onChange).toHaveBeenCalledTimes(1);
    const newSchema = onChange.mock.calls[0][0] as FormSchema;
    expect(newSchema.fields.length).toBe(0);
  });
});

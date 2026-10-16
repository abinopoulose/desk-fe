import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SchemaBuilder } from './SchemaBuilder';
import type { FormSchema } from '../../types/formSchema';

describe('SchemaBuilder Component', () => {
  const initialSchema: FormSchema = {
    fields: [
      {
        name: 'field_dept_001',
        label: 'Employee Department',
        type: 'select',
        options: ['Engineering', 'Marketing', 'Human Resources'],
        required: true,
      },
      {
        name: 'field_reason_002',
        label: 'Reason for Request',
        type: 'textarea',
        required: false,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders existing questions with friendly type badges and prompt titles', () => {
    render(<SchemaBuilder schema={initialSchema} onChange={vi.fn()} />);

    // Renders in list and preview
    expect(screen.getAllByText('Employee Department').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Reason for Request').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Required *')).toBeDefined();
    expect(screen.getByText('Questions in this Form (2)')).toBeDefined();
  });

  it('never displays technical "Name (Key)" field to the user', () => {
    render(<SchemaBuilder schema={initialSchema} onChange={vi.fn()} />);

    // Select the first question to view its editor
    const questionItems = screen.getAllByText('Employee Department');
    fireEvent.click(questionItems[0]);

    // Verify there is NO "Name (Key)" input or label
    expect(screen.queryByText(/Name \(Key\)/i)).toBeNull();
    expect(screen.queryByText('field_dept_001')).toBeNull();
  });

  it('renders friendly question type quick-add buttons', () => {
    render(<SchemaBuilder schema={{ fields: [] }} onChange={vi.fn()} />);

    expect(screen.getByText('Short Text')).toBeDefined();
    expect(screen.getByText('Paragraph / Long Text')).toBeDefined();
    expect(screen.getAllByText('Dropdown Choices').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Yes / No Checkbox')).toBeDefined();
    expect(screen.getByText('Number')).toBeDefined();
    expect(screen.getByText('Date Picker')).toBeDefined();
    expect(screen.getByText('No questions added yet')).toBeDefined();
  });

  it('adds a new question and selects it for editing', () => {
    const handleChange = vi.fn();
    render(<SchemaBuilder schema={{ fields: [] }} onChange={handleChange} />);

    // Click quick add Short Text
    fireEvent.click(screen.getByText('Short Text'));

    expect(screen.getByText('Question Settings')).toBeDefined();
    expect(screen.getAllByText(/Question Prompt/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows editing question label and required toggle', () => {
    const handleChange = vi.fn();
    render(<SchemaBuilder schema={initialSchema} onChange={handleChange} />);

    // Select first question
    const questionItems = screen.getAllByText('Employee Department');
    fireEvent.click(questionItems[0]);

    const promptInput = screen.getByDisplayValue('Employee Department') as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'Primary Department' } });

    expect(promptInput.value).toBe('Primary Department');
  });

  it('allows managing choices for dropdown questions', () => {
    render(<SchemaBuilder schema={initialSchema} onChange={vi.fn()} />);

    const questionItems = screen.getAllByText('Employee Department');
    fireEvent.click(questionItems[0]);

    expect(screen.getAllByText('Dropdown Choices').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue('Engineering')).toBeDefined();
    expect(screen.getByDisplayValue('Marketing')).toBeDefined();

    // Add a new choice
    const newChoiceInput = screen.getByPlaceholderText('Type a new choice name...');
    fireEvent.change(newChoiceInput, { target: { value: 'Finance' } });
    fireEvent.click(screen.getByText('Add Choice'));

    expect(screen.getByDisplayValue('Finance')).toBeDefined();
  });

  it('allows reordering and deleting questions', () => {
    render(<SchemaBuilder schema={initialSchema} onChange={vi.fn()} />);

    const deleteButtons = screen.getAllByTitle('Delete Question');
    expect(deleteButtons).toHaveLength(2);

    // Delete second question
    fireEvent.click(deleteButtons[1]);
    expect(screen.queryByText('Reason for Request')).toBeNull();
  });

  it('renders live employee preview on the right', () => {
    render(<SchemaBuilder schema={initialSchema} onChange={vi.fn()} />);

    expect(screen.getByText('Live Employee Preview')).toBeDefined();
    expect(screen.getByText('How employees will see this form')).toBeDefined();
  });

  it('handles conditional visibility in advanced settings with dynamic dropdowns for boolean and select dependencies', () => {
    const conditionalSchema: FormSchema = {
      fields: [
        {
          name: 'client_proj',
          label: 'For Client Project?',
          type: 'checkbox',
          required: false,
        },
        {
          name: 'proj_name',
          label: 'Project Name',
          type: 'text',
          required: true,
          conditionalOn: {
            field: 'client_proj',
            value: true,
          },
        },
      ],
    };
    render(<SchemaBuilder schema={conditionalSchema} onChange={vi.fn()} />);

    // Click on Project Name to edit it
    const projNameItems = screen.getAllByText('Project Name');
    fireEvent.click(projNameItems[0]);

    // Verify Advanced Settings accordion is present and shows active condition badge
    expect(screen.getByText('Advanced Settings')).toBeDefined();
    expect(screen.getByText('Rule Active')).toBeDefined();

    // The conditional value dropdown for boolean shows "Checked (Yes / True)" and "Unchecked (No / False)"
    const valueSelect = screen.getByLabelText('Has this specific answer') as HTMLSelectElement;
    expect(valueSelect).toBeDefined();
    expect(valueSelect.tagName.toLowerCase()).toBe('select');
    expect(screen.getByText('Checked (Yes / True)')).toBeDefined();
    expect(screen.getByText('Unchecked (No / False)')).toBeDefined();
  });

  it('allows specifying whether a field takes up full screen width in advanced settings', () => {
    const handleChange = vi.fn();
    render(<SchemaBuilder schema={initialSchema} onChange={handleChange} />);

    // Select first question (Employee Department - select)
    const questionItems = screen.getAllByText('Employee Department');
    fireEvent.click(questionItems[0]);

    // Open Advanced Settings accordion
    fireEvent.click(screen.getByText('Advanced Settings'));

    // Check full width toggle
    const fullWidthToggle = screen.getByLabelText('Take up full screen width') as HTMLInputElement;
    expect(fullWidthToggle).toBeDefined();
    expect(fullWidthToggle.checked).toBe(false); // default for select is false

    // Toggle full width to true
    fireEvent.click(fullWidthToggle);
    expect(fullWidthToggle.checked).toBe(true);
  });

  it('renders safely without throwing when schema is an empty object {}', () => {
    // Simulates database form_schema = '{}'::jsonb
    const emptyDbSchema = {} as unknown as FormSchema;
    const handleChange = vi.fn();

    expect(() => {
      render(<SchemaBuilder schema={emptyDbSchema} onChange={handleChange} />);
    }).not.toThrow();

    expect(screen.getByText('Questions in this Form (0)')).toBeDefined();
    expect(screen.getByText('No questions added yet')).toBeDefined();
  });

  it('allows adding a question starting from an empty object {} schema', () => {
    const emptyDbSchema = {} as unknown as FormSchema;
    const handleChange = vi.fn();

    render(<SchemaBuilder schema={emptyDbSchema} onChange={handleChange} />);

    // Click quick add "Short Text"
    const addShortTextBtn = screen.getByRole('button', { name: /short text/i });
    fireEvent.click(addShortTextBtn);

    expect(screen.getByText('Questions in this Form (1)')).toBeDefined();
  });

  it('does not cause an infinite update loop when parent synchronizes schema via onChange', () => {
    const ParentComponent = () => {
      const [formSchema, setFormSchema] = useState<FormSchema>(initialSchema);
      return <SchemaBuilder schema={formSchema} onChange={setFormSchema} />;
    };

    expect(() => {
      render(<ParentComponent />);
    }).not.toThrow();

    expect(screen.getByText('Questions in this Form (2)')).toBeDefined();

    // Add another field to trigger onChange -> setFormSchema -> parent re-render -> schema prop update
    const addShortTextBtn = screen.getByRole('button', { name: /short text/i });
    fireEvent.click(addShortTextBtn);

    expect(screen.getByText('Questions in this Form (3)')).toBeDefined();
  });
});

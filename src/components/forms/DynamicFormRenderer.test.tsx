import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import type { FormSchema } from '../../types/formSchema';

describe('DynamicFormRenderer', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders safely when schema is empty object without fields', () => {
    const handleSubmit = vi.fn();
    render(<DynamicFormRenderer schema={{} as FormSchema} onSubmit={handleSubmit} />);

    expect(screen.getByRole('button', { name: /submit/i })).toBeDefined();
    expect(screen.getByText(/no additional fields are required/i)).toBeDefined();
  });

  it('renders safely when schema has empty fields array', () => {
    const handleSubmit = vi.fn();
    render(<DynamicFormRenderer schema={{ fields: [] }} onSubmit={handleSubmit} />);

    expect(screen.getByRole('button', { name: /submit/i })).toBeDefined();
    expect(screen.getByText(/no additional fields are required/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(handleSubmit).toHaveBeenCalledWith({});
  });

  it('renders defined form fields and handles submit', () => {
    const handleSubmit = vi.fn();
    const schema: FormSchema = {
      fields: [
        { name: 'subject', label: 'Ticket Subject', type: 'text', required: true },
        { name: 'details', label: 'Issue Details', type: 'textarea' },
      ],
    };

    render(<DynamicFormRenderer schema={schema} onSubmit={handleSubmit} />);

    const subjectInput = screen.getByLabelText(/ticket subject/i);
    const detailsInput = screen.getByLabelText(/issue details/i);
    expect(subjectInput).toBeDefined();
    expect(detailsInput).toBeDefined();

    fireEvent.change(subjectInput, { target: { value: 'Printer issue' } });
    fireEvent.change(detailsInput, { target: { value: 'Office printer is offline' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      subject: 'Printer issue',
      details: 'Office printer is offline',
    });
  });
});

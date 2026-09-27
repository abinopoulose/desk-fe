import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { FormSchema } from '../types/formSchema';
import React from 'react';

const mockSchema: FormSchema = {
  fields: [
    { name: 'username', label: 'Username', type: 'text', required: true, minLength: 3 },
    { name: 'bio', label: 'Biography', type: 'textarea', maxLength: 100 },
    { name: 'age', label: 'Age', type: 'number', min: 18, max: 99 },
    { name: 'role', label: 'Role', type: 'select', options: ['Admin', 'User'] },
    { name: 'subscribe', label: 'Subscribe', type: 'checkbox' },
    { name: 'joinDate', label: 'Join Date', type: 'date' },
    { 
      name: 'adminCode', 
      label: 'Admin Code', 
      type: 'text', 
      conditionalOn: { field: 'role', value: 'Admin' } 
    }
  ]
};

describe('DynamicFormRenderer', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all unconditional fields based on schema', () => {
    render(<DynamicFormRenderer schema={mockSchema} onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Biography/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subscribe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Join Date/i)).toBeInTheDocument();
    
    // Conditional field should not be visible initially
    expect(screen.queryByLabelText(/Admin Code/i)).not.toBeInTheDocument();
  });

  it('shows validation error when required field is empty', async () => {
    const onSubmit = vi.fn();
    render(<DynamicFormRenderer schema={mockSchema} onSubmit={onSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for minLength constraint', async () => {
    const onSubmit = vi.fn();
    render(<DynamicFormRenderer schema={mockSchema} onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    expect(await screen.findByText('Minimum length is 3')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows conditional field when condition is met', async () => {
    render(<DynamicFormRenderer schema={mockSchema} onSubmit={vi.fn()} />);
    
    fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'Admin' } });
    
    expect(await screen.findByLabelText(/Admin Code/i)).toBeInTheDocument();
  });

  it('submits correct data when form is valid', async () => {
    const onSubmit = vi.fn();
    render(<DynamicFormRenderer schema={mockSchema} onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'User' } });
    fireEvent.click(screen.getByLabelText(/Subscribe/i));
    
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      username: 'johndoe',
      age: 25,
      role: 'User',
      subscribe: true,
    });
  });

  it('strips out hidden conditional fields on submit', async () => {
    const onSubmit = vi.fn();
    render(<DynamicFormRenderer schema={mockSchema} onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'johndoe' } });
    
    // Fill the conditional field by making it visible first
    fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'Admin' } });
    fireEvent.change(screen.getByLabelText(/Admin Code/i), { target: { value: '123' } });
    
    // Now hide it again
    fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'User' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    // adminCode should not be in the submitted data since it's hidden
    expect(onSubmit).toHaveBeenCalledWith({
      username: 'johndoe',
      role: 'User',
      // adminCode is excluded!
    });
  });
});

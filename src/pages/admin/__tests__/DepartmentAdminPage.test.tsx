import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { DepartmentAdminPage } from '../DepartmentAdminPage';
import { departmentApi } from '../../../api/departmentApi';
import { BrowserRouter } from 'react-router';

// Mock the PrivilegeGate so it just renders children
vi.mock('../../../components/auth/PrivilegeGate', () => ({
  PrivilegeGate: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('../../../api/departmentApi', () => ({
  departmentApi: {
    getAllDepartments: vi.fn(),
    createDepartment: vi.fn(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
  }
}));

describe('DepartmentAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(departmentApi.getAllDepartments).mockResolvedValue([
      { id: '1', name: 'IT', description: 'Tech team', createdAt: '2023', updatedAt: '2023' }
    ]);
  });
  
  afterEach(() => {
    cleanup();
  });

  it('renders a list of departments', async () => {
    render(
      <BrowserRouter>
        <DepartmentAdminPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading...')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.getByText('Departments Management')).toBeTruthy();
      expect(screen.getByText('IT')).toBeTruthy();
      expect(screen.getByText('Tech team')).toBeTruthy();
    });
  });

  it('opens create modal and creates a department', async () => {
    vi.mocked(departmentApi.createDepartment).mockResolvedValueOnce({
      id: '2', name: 'HR', description: 'Human Resources', createdAt: '2023', updatedAt: '2023'
    });

    render(
      <BrowserRouter>
        <DepartmentAdminPage />
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText('IT')).toBeTruthy());

    fireEvent.click(screen.getAllByText('Create Department')[0]);
    expect(screen.getAllByText('Create Department')).toBeTruthy();

    const nameInput = screen.getByLabelText('Name');
    const descInput = screen.getByLabelText('Description');

    fireEvent.change(nameInput, { target: { value: 'HR' } });
    fireEvent.change(descInput, { target: { value: 'Human Resources' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(departmentApi.createDepartment).toHaveBeenCalledWith({
        name: 'HR',
        description: 'Human Resources'
      });
      expect(departmentApi.getAllDepartments).toHaveBeenCalledTimes(2);
    });
  });

  it('opens edit modal and updates a department', async () => {
    vi.mocked(departmentApi.updateDepartment).mockResolvedValueOnce({
      id: '1', name: 'IT Updated', description: 'Tech team', createdAt: '2023', updatedAt: '2023'
    });

    render(
      <BrowserRouter>
        <DepartmentAdminPage />
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText('IT')).toBeTruthy());

    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByText('Edit Department')).toBeTruthy();

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'IT Updated' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(departmentApi.updateDepartment).toHaveBeenCalledWith('1', {
        name: 'IT Updated',
        description: 'Tech team'
      });
      expect(departmentApi.getAllDepartments).toHaveBeenCalledTimes(2);
    });
  });

  it('deletes a department after confirmation', async () => {
    vi.mocked(departmentApi.deleteDepartment).mockResolvedValueOnce(undefined);
    window.confirm = vi.fn(() => true);

    render(
      <BrowserRouter>
        <DepartmentAdminPage />
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText('IT')).toBeTruthy());

    fireEvent.click(screen.getByText('Delete'));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete the department "IT"?');

    await waitFor(() => {
      expect(departmentApi.deleteDepartment).toHaveBeenCalledWith('1');
      expect(departmentApi.getAllDepartments).toHaveBeenCalledTimes(2);
    });
  });
});

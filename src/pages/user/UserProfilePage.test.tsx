import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { UserProfilePage } from './UserProfilePage';
import * as userHook from '../../hooks/useUserProfile';

describe('UserProfilePage Component', () => {
  const mockProfile = {
    id: 'c08a3dab-2946-46a6-98b0-7d632d3a58d8',
    fullName: 'Jane Developer',
    title: 'Senior Software Engineer',
    email: 'jane.dev@example.com',
    profilePictureUrl: '',
    isActive: true,
    roles: ['ADMIN', 'USER'],
    manager: {
      id: 'mgr-123',
      fullName: 'John Manager',
      email: 'john.mgr@example.com',
      title: 'VP of Engineering',
    },
    reportees: [
      {
        id: 'rep-001',
        fullName: 'Bob Junior',
        email: 'bob.jr@example.com',
        title: 'Junior Developer',
      },
    ],
  };

  const mockStartEdit = vi.fn();
  const mockCancelEdit = vi.fn();
  const mockSetField = vi.fn();
  const mockSave = vi.fn();
  const mockUploadPicture = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders user details, reporting manager, assigned roles, and direct reportees', () => {
    vi.spyOn(userHook, 'useUserProfile').mockReturnValue({
      profile: mockProfile,
      loading: false,
      saving: false,
      error: null,
      isEditing: false,
      editForm: {},
      startEdit: mockStartEdit,
      cancelEdit: mockCancelEdit,
      setField: mockSetField,
      save: mockSave,
      uploadPicture: mockUploadPicture,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter initialEntries={['/users/c08a3dab-2946-46a6-98b0-7d632d3a58d8']}>
        <Routes>
          <Route path="/users/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Jane Developer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Senior Software Engineer')).toBeDefined();
    expect(screen.getByText('jane.dev@example.com')).toBeDefined();
    expect(screen.getByText('Active Employee')).toBeDefined();
    expect(screen.getByText('John Manager')).toBeDefined();
    expect(screen.getByText('ADMIN')).toBeDefined();
    expect(screen.getByText('Bob Junior')).toBeDefined();
  });

  it('allows clicking Edit Details button to trigger editing', () => {
    vi.spyOn(userHook, 'useUserProfile').mockReturnValue({
      profile: mockProfile,
      loading: false,
      saving: false,
      error: null,
      isEditing: false,
      editForm: {},
      startEdit: mockStartEdit,
      cancelEdit: mockCancelEdit,
      setField: mockSetField,
      save: mockSave,
      uploadPicture: mockUploadPicture,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter initialEntries={['/users/c08a3dab-2946-46a6-98b0-7d632d3a58d8']}>
        <Routes>
          <Route path="/users/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    const editButtons = screen.getAllByText('Edit Details');
    expect(editButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(editButtons[0]);
    expect(mockStartEdit).toHaveBeenCalledTimes(1);
  });

  it('renders edit modal with editable fields and allows saving changes', () => {
    vi.spyOn(userHook, 'useUserProfile').mockReturnValue({
      profile: mockProfile,
      loading: false,
      saving: false,
      error: null,
      isEditing: true,
      editForm: {
        fullName: 'Jane Developer',
        title: 'Senior Software Engineer',
        email: 'jane.dev@example.com',
        isActive: true,
      },
      startEdit: mockStartEdit,
      cancelEdit: mockCancelEdit,
      setField: mockSetField,
      save: mockSave,
      uploadPicture: mockUploadPicture,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter initialEntries={['/users/c08a3dab-2946-46a6-98b0-7d632d3a58d8']}>
        <Routes>
          <Route path="/users/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Edit User Details')).toBeDefined();
    const nameInput = screen.getByDisplayValue('Jane Developer');
    expect(nameInput).toBeDefined();

    fireEvent.change(nameInput, { target: { value: 'Jane Lead' } });
    expect(mockSetField).toHaveBeenCalledWith('fullName', 'Jane Lead');

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('allows changing reporting manager in edit modal', () => {
    vi.spyOn(userHook, 'useUserProfile').mockReturnValue({
      profile: mockProfile,
      loading: false,
      saving: false,
      error: null,
      isEditing: true,
      editForm: {
        fullName: 'Jane Developer',
        title: 'Senior Software Engineer',
        email: 'jane.dev@example.com',
        managerId: 'mgr-123',
        isActive: true,
      },
      startEdit: mockStartEdit,
      cancelEdit: mockCancelEdit,
      setField: mockSetField,
      save: mockSave,
      uploadPicture: mockUploadPicture,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter initialEntries={['/users/c08a3dab-2946-46a6-98b0-7d632d3a58d8']}>
        <Routes>
          <Route path="/users/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    const managerSelect = screen.getByLabelText('Reporting Manager');
    expect(managerSelect).toBeDefined();

    fireEvent.change(managerSelect, { target: { value: '' } });
    expect(mockSetField).toHaveBeenCalledWith('managerId', null);
  });

  it('allows toggling account active status in edit modal', () => {
    vi.spyOn(userHook, 'useUserProfile').mockReturnValue({
      profile: mockProfile,
      loading: false,
      saving: false,
      error: null,
      isEditing: true,
      editForm: {
        fullName: 'Jane Developer',
        title: 'Senior Software Engineer',
        email: 'jane.dev@example.com',
        isActive: true,
      },
      startEdit: mockStartEdit,
      cancelEdit: mockCancelEdit,
      setField: mockSetField,
      save: mockSave,
      uploadPicture: mockUploadPicture,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter initialEntries={['/users/c08a3dab-2946-46a6-98b0-7d632d3a58d8']}>
        <Routes>
          <Route path="/users/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDefined();
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(toggle);
    expect(mockSetField).toHaveBeenCalledWith('isActive', false);
  });
});

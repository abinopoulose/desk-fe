import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTicketTypeForm } from '../useTicketTypeForm';
import { ticketTypeApi } from '../../api/ticketTypeApi';
import type { TicketTypeDTO } from '../../types/ticket';

vi.mock('../../api/ticketTypeApi', () => ({
  ticketTypeApi: {
    getTicketTypeById: vi.fn(),
    createTicketType: vi.fn(),
    updateTicketType: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useParams: vi.fn(() => ({})),
  useSearchParams: vi.fn(() => [new URLSearchParams()]),
  useNavigate: () => mockNavigate,
}));

describe('useTicketTypeForm hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values in create mode', () => {
    const { result } = renderHook(() => useTicketTypeForm());

    expect(result.current.isEditMode).toBe(false);
    expect(result.current.ticketTypeId).toBeUndefined();
    expect(result.current.title).toBe('');
    expect(result.current.description).toBe('');
    expect(result.current.folderId).toBe('');
    expect(result.current.departmentId).toBe('');
    expect(result.current.formSchema).toEqual({ fields: [] });
    expect(result.current.isActive).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches existing data in edit mode when ID is provided', async () => {
    const mockData: TicketTypeDTO = {
      id: 'type-123',
      title: 'Existing Type',
      description: 'Existing Description',
      folderId: 'folder-abc',
      departmentId: 'dept-xyz',
      formSchema: { fields: [{ name: 'reason', label: 'Reason', type: 'text', required: true }] },
      isActive: false,
    };
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useTicketTypeForm('type-123'));

    expect(result.current.isEditMode).toBe(true);
    expect(result.current.loading).toBe(true);

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.title).toBe('Existing Type');
    expect(result.current.description).toBe('Existing Description');
    expect(result.current.folderId).toBe('folder-abc');
    expect(result.current.departmentId).toBe('dept-xyz');
    expect(result.current.formSchema).toEqual({ fields: [{ name: 'reason', label: 'Reason', type: 'text', required: true }] });
    expect(result.current.isActive).toBe(false);
    expect(result.current.error).toBeNull();
    expect(ticketTypeApi.getTicketTypeById).toHaveBeenCalledWith('type-123');
  });

  it('handles error when fetching ticket type fails in edit mode', async () => {
    vi.mocked(ticketTypeApi.getTicketTypeById).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTicketTypeForm({ ticketTypeId: 'type-err' }));

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to load ticket type.');
  });

  it('updates form fields individually and via setFormField', () => {
    const { result } = renderHook(() => useTicketTypeForm());

    act(() => {
      result.current.setTitle('New Hardware Request');
      result.current.setDescription('Request new equipment');
      result.current.setFolderId('IT/Hardware');
      result.current.setDepartmentId('IT');
      result.current.setIsActive(false);
      result.current.setFormSchema({ fields: [{ name: 'model', label: 'Model', type: 'text' }] });
    });

    expect(result.current.title).toBe('New Hardware Request');
    expect(result.current.description).toBe('Request new equipment');
    expect(result.current.folderId).toBe('IT/Hardware');
    expect(result.current.departmentId).toBe('IT');
    expect(result.current.isActive).toBe(false);
    expect(result.current.formSchema.fields).toHaveLength(1);

    act(() => {
      result.current.setFormField('title', 'Updated Hardware Request');
    });

    expect(result.current.title).toBe('Updated Hardware Request');
  });

  it('submits form in create mode and navigates', async () => {
    const createdData: TicketTypeDTO = {
      id: 'new-id',
      title: 'New Type',
      description: 'Desc',
      folderId: 'f1',
      departmentId: 'd1',
      formSchema: { fields: [] },
      isActive: true,
    };
    vi.mocked(ticketTypeApi.createTicketType).mockResolvedValueOnce(createdData);

    const { result } = renderHook(() => useTicketTypeForm());

    act(() => {
      result.current.setTitle('New Type');
      result.current.setDescription('Desc');
      result.current.setFolderId('f1');
      result.current.setDepartmentId('d1');
    });

    let res: TicketTypeDTO | null = null;
    await act(async () => {
      res = await result.current.handleSubmit();
    });

    expect(res).toEqual(createdData);
    expect(result.current.success).toBe(true);
    expect(ticketTypeApi.createTicketType).toHaveBeenCalledWith({
      title: 'New Type',
      description: 'Desc',
      folderId: 'f1',
      departmentId: 'd1',
      formSchema: { fields: [] },
      isActive: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/admin/ticket-types');
  });

  it('submits form in edit mode and triggers custom onSuccess callback', async () => {
    const existingData: TicketTypeDTO = {
      id: 'edit-1',
      title: 'Old Title',
      description: 'Old Desc',
      folderId: 'f1',
      departmentId: 'd1',
      formSchema: { fields: [] },
      isActive: true,
    };
    const updatedData: TicketTypeDTO = {
      ...existingData,
      title: 'Updated Title',
    };
    vi.mocked(ticketTypeApi.getTicketTypeById).mockResolvedValueOnce(existingData);
    vi.mocked(ticketTypeApi.updateTicketType).mockResolvedValueOnce(updatedData);

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useTicketTypeForm({ ticketTypeId: 'edit-1', onSuccess }));

    await act(async () => {});

    act(() => {
      result.current.setTitle('Updated Title');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(ticketTypeApi.updateTicketType).toHaveBeenCalledWith('edit-1', expect.objectContaining({
      title: 'Updated Title',
    }));
    expect(onSuccess).toHaveBeenCalledWith(updatedData);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles submission error gracefully', async () => {
    vi.mocked(ticketTypeApi.createTicketType).mockRejectedValueOnce(new Error('Validation failed'));

    const { result } = renderHook(() => useTicketTypeForm());

    let res: TicketTypeDTO | null = null;
    await act(async () => {
      res = await result.current.handleSubmit();
    });

    expect(res).toBeNull();
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBe('Failed to save ticket type. Please try again.');
    expect(result.current.success).toBe(false);
  });

  it('resets form back to default values', () => {
    const { result } = renderHook(() => useTicketTypeForm());

    act(() => {
      result.current.setTitle('Temp Title');
      result.current.setDescription('Temp Desc');
    });

    expect(result.current.title).toBe('Temp Title');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.title).toBe('');
    expect(result.current.description).toBe('');
    expect(result.current.isActive).toBe(true);
  });
});


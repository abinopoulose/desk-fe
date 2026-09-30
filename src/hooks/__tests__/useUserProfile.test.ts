import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserProfile } from '../useUserProfile';
import { getUserProfile, updateUserProfile } from '../../api/userApi';
import { VALIDATION_MESSAGES } from '../../constants';
import type { UserProfileResponse } from '../../types/user';

vi.mock('../../api/userApi', () => ({
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}));

describe('useUserProfile hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfile: UserProfileResponse = {
    id: 'u1',
    fullName: 'Test User',
    email: 'test@example.com',
    title: 'Engineer',
    departmentName: 'Engineering',
    manager: null,
    reportees: [],
    roles: [],
    isActive: true,
  };

  it('fetches profile successfully', async () => {
    vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile);

    const { result } = renderHook(() => useUserProfile('u1'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error 404', async () => {
    vi.mocked(getUserProfile).mockRejectedValueOnce({ response: { status: 404 } });

    const { result } = renderHook(() => useUserProfile('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('404');
  });

  it('toggles edit mode', async () => {
    vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile);
    const { result } = renderHook(() => useUserProfile('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.startEdit();
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.editForm).toEqual(mockProfile);

    act(() => {
      result.current.setField('fullName', 'New Name');
    });

    expect(result.current.editForm.fullName).toBe('New Name');

    act(() => {
      result.current.cancelEdit();
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.editForm).toEqual({});
  });

  it('validates profile before save', async () => {
    vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile);
    const { result } = renderHook(() => useUserProfile('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.startEdit();
    });

    act(() => {
      result.current.setField('fullName', '');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toBe(VALIDATION_MESSAGES.REQUIRED);
    expect(updateUserProfile).not.toHaveBeenCalled();

    act(() => {
      result.current.setField('fullName', 'Valid Name');
      result.current.setField('email', 'invalid-email');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toBe(VALIDATION_MESSAGES.EMAIL_INVALID);
  });

  it('saves profile successfully', async () => {
    vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile);
    
    const updatedProfile = { ...mockProfile, fullName: 'Updated Name' };
    vi.mocked(updateUserProfile).mockResolvedValueOnce(updatedProfile);

    const { result } = renderHook(() => useUserProfile('u1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.startEdit();
      result.current.setField('fullName', 'Updated Name');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(updateUserProfile).toHaveBeenCalledWith('u1', result.current.editForm);
    expect(result.current.profile).toEqual(updatedProfile);
    expect(result.current.isEditing).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

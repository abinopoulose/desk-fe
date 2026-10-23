import { useState, useCallback, useEffect } from 'react';
import { getUserProfile, updateUserProfile, uploadProfilePicture } from '../api/userApi';
import type { UserProfileResponse } from '../types/user';

import { required, email } from '../utils/validation';

export const validateProfile = (profile: Partial<UserProfileResponse>): string | null => {
  if (profile.fullName !== undefined) {
    const nameError = required(profile.fullName);
    if (nameError) return nameError;
  }
  if (profile.email !== undefined) {
    const emailError = email(profile.email);
    if (emailError) return emailError;
  }
  return null;
};

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<UserProfileResponse>>({});

  const fetchProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile(id);
      setProfile(data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status: number } };
      if (errorObj.response?.status === 404) {
        setError('404');
      } else {
        setError('Network failure or generic error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchProfile(userId);
    }
  }, [userId, fetchProfile]);

  const startEdit = useCallback(() => {
    if (profile) {
      const activeState = profile.isActive ?? profile.active ?? true;
      setEditForm({
        ...profile,
        isActive: activeState,
        active: activeState,
        managerId: profile.manager?.id ?? null,
      });
      setIsEditing(true);
      setError(null);
    }
  }, [profile]);

  const cancelEdit = useCallback(() => {
    setEditForm({});
    setIsEditing(false);
    setError(null);
  }, []);

  const setField = useCallback(<K extends keyof UserProfileResponse>(field: K, value: UserProfileResponse[K]) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const save = useCallback(async () => {
    if (!userId || !profile) return;
    
    const validationError = validateProfile(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const resolvedIsActive = editForm.isActive !== undefined 
        ? editForm.isActive 
        : (editForm.active !== undefined 
          ? editForm.active 
          : (profile.isActive ?? profile.active ?? true));

      const payload = {
        fullName: editForm.fullName ?? profile.fullName,
        title: editForm.title ?? profile.title,
        managerId: editForm.managerId !== undefined ? editForm.managerId : (profile.manager?.id ?? null),
        isActive: resolvedIsActive,
        active: resolvedIsActive,
      };
      const updated = await updateUserProfile(userId, payload);
      if (updated && updated.id) {
        setProfile(updated);
      } else {
        await fetchProfile(userId);
      }
      setIsEditing(false);
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [userId, profile, editForm, fetchProfile]);

  const refetch = useCallback(() => {
    if (userId) {
      return fetchProfile(userId);
    }
    return Promise.resolve();
  }, [userId, fetchProfile]);

  const uploadPicture = useCallback(async (file: File) => {
    if (!userId) return;
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Profile picture must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await uploadProfilePicture(userId, file);
      setProfile(updated);
    } catch {
      setError('Failed to upload profile picture');
    } finally {
      setSaving(false);
    }
  }, [userId]);

  return {
    profile,
    loading,
    saving,
    error,
    isEditing,
    startEdit,
    cancelEdit,
    setField,
    save,
    refetch,
    editForm,
    uploadPicture
  };
}

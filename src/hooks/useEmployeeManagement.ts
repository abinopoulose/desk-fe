import { useState, useEffect, useCallback } from 'react';
import { getOrgUsers, inviteEmployee, resendInvitation } from '../api/employeeApi';
import { updateUserProfile } from '../api/userApi';
import type { User, InviteEmployeeRequest, UpdateUserProfilePayload } from '../types/user';
import { isAxiosError } from 'axios';

export const useEmployeeManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrgUsers();
      setUsers(data);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInvite = async (data: InviteEmployeeRequest) => {
    setInviteLoading(true);
    setInviteError(null);
    try {
      await inviteEmployee(data);
      setIsInviteModalOpen(false);
      fetchUsers();
    } catch (err) {
      if (isAxiosError(err)) {
        setInviteError(err.response?.data?.message || 'Failed to invite user');
      } else {
        setInviteError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      await resendInvitation(userId);
      // Could show toast success here
    } catch (err) {
      console.error('Failed to resend invitation', err);
      throw err;
    }
  };

  const handleUpdateEmployee = async (userId: string, data: UpdateUserProfilePayload) => {
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const updated = await updateUserProfile(userId, data);
      await fetchUsers();
      return updated;
    } catch (err) {
      if (isAxiosError(err)) {
        setUpdateError(err.response?.data?.message || 'Failed to update employee');
      } else {
        setUpdateError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setUpdateLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    inviteError,
    isInviteModalOpen,
    setIsInviteModalOpen,
    inviteLoading,
    handleInvite,
    handleResendInvite,
    handleUpdateEmployee,
    updateLoading,
    updateError,
    refresh: fetchUsers,
  };
};

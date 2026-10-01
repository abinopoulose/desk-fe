import { useState, useEffect, useCallback } from 'react';
import { getOrgUsers, inviteEmployee, resendInvitation } from '../api/employeeApi';
import type { User, InviteEmployeeRequest } from '../types/user';
import { isAxiosError } from 'axios';

export const useEmployeeManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

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
    refresh: fetchUsers,
  };
};

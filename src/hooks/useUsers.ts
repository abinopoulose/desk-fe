import { useState, useCallback } from 'react';
import { getUserProfile, getOrgHierarchy } from '../api/userApi';
import type { UserProfileResponse, OrgNode } from '../types/user';

export interface UsersData {
  profile: UserProfileResponse | null;
  hierarchy: OrgNode[] | null;
}

export function useUsers() {
  const [data, setData] = useState<UsersData>({
    profile: null,
    hierarchy: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfileResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserProfile(userId);
      setData((prev) => ({ ...prev, profile: response }));
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user profile';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrgHierarchy = useCallback(async (rootUserId?: string): Promise<OrgNode[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrgHierarchy(rootUserId);
      setData((prev) => ({ ...prev, hierarchy: response }));
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch organization hierarchy';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchUserProfile,
    fetchOrgHierarchy,
  };
}

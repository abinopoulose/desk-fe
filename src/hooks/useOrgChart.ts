import { useState, useCallback, useEffect } from 'react';
import { getOrgHierarchy } from '../api/userApi';
import type { OrgNode } from '../types/user';

export const useOrgChart = () => {
  const [orgData, setOrgData] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hierarchy = await getOrgHierarchy();
      setOrgData(hierarchy);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch org hierarchy';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchHierarchy();
  }, [fetchHierarchy]);

  return {
    orgData,
    loading,
    error,
    refetch: fetchHierarchy,
  };
};

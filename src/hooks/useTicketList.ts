import { useState, useEffect, useCallback, useRef } from 'react';
import { ticketApi } from '../api/ticketApi';
import type { TicketDTO, TicketFilterParams } from '../types/ticket';
import { useAuth } from '../store/authStore';
import { APP_CONFIG } from '../constants';

export interface TicketListFilters {
  tab: 'my' | 'assigned' | 'all';
  status: string;
  mappedState: string;
  assigneeId: string;
  priority: string;
  search: string;
}

export interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setSize: (newSize: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export function useTicketList(initialFilters?: Partial<TicketListFilters>) {
  const { user } = useAuth();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [filters, setFilters] = useState<TicketListFilters>({
    tab: initialFilters?.tab || 'my',
    status: initialFilters?.status || '',
    mappedState: initialFilters?.mappedState || '',
    assigneeId: initialFilters?.assigneeId || '',
    priority: initialFilters?.priority || '',
    search: initialFilters?.search || '',
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(APP_CONFIG.TICKETS.DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [sort, setSortState] = useState<string>(APP_CONFIG.TICKETS.DEFAULT_SORT);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setDebouncedSearch(filters.search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const setFilter = useCallback(
    <K extends keyof TicketListFilters>(key: K, value: TicketListFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(0);
    },
    []
  );

  const setSort = useCallback((newSort: string) => {
    setSortState(newSort);
    setPage(0);
  }, []);

  const handleSort = useCallback((field: string) => {
    setSortState((prev) => {
      const [currentField, currentDir] = prev.split(',');
      if (currentField === field) {
        return `${field},${currentDir === 'asc' ? 'desc' : 'asc'}`;
      }
      return `${field},asc`;
    });
    setPage(0);
  }, []);

  const fetchTickets = useCallback(
    async (currentSearch: string) => {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);
      try {
        const params: TicketFilterParams = {
          tab: filters.tab,
          page,
          size,
          sort,
        };

        if (filters.tab === 'my' && user?.id) {
          params.requesterId = user.id;
        }
        if (filters.tab === 'assigned' && user?.id) {
          params.assigneeId = user.id;
        } else if (filters.assigneeId) {
          params.assigneeId = filters.assigneeId;
        }
        if (filters.status) {
          params.status = filters.status;
        }
        if (filters.mappedState) {
          params.mappedState = filters.mappedState as 'OPEN' | 'CLOSED';
        }
        if (filters.priority) {
          params.priority = Number(filters.priority);
        }
        if (currentSearch) {
          params.search = currentSearch;
        }

        const res = await ticketApi.getTickets(params);
        if (isMountedRef.current) {
          setTickets(res.tickets || []);
          setTotalElements(res.totalElements || 0);
          setTotalPages(res.totalPages || 0);
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const message = err instanceof Error ? err.message : 'Failed to fetch tickets';
          setError(message);
          console.error('Failed to fetch tickets:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [
      filters.tab,
      filters.status,
      filters.mappedState,
      filters.assigneeId,
      filters.priority,
      page,
      size,
      sort,
      user,
    ]
  );

  useEffect(() => {
    const load = async () => {
      await fetchTickets(debouncedSearch);
    };
    load();
  }, [fetchTickets, debouncedSearch]);

  const refetch = useCallback(() => {
    return fetchTickets(filters.search);
  }, [fetchTickets, filters.search]);

  const nextPage = useCallback(() => {
    setPage((p) => (p < totalPages - 1 ? p + 1 : p));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => (p > 0 ? p - 1 : p));
  }, []);

  const updateSize = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(0);
  }, []);

  const pagination: PaginationState = {
    page,
    size,
    totalElements,
    totalPages,
    setPage,
    setSize: updateSize,
    nextPage,
    prevPage,
  };

  return {
    tickets,
    loading,
    error,
    filters,
    setFilter,
    sort,
    setSort,
    handleSort,
    pagination,
    refetch,
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { ticketApi } from '../api/ticketApi';
import type { TicketDTO, TicketFilterParams } from '../types/ticket';
import { useAuth } from '../store/authStore';
import { APP_CONFIG } from '../constants';
import type { ApiError } from '../utils/apiErrorHandler';

export interface TicketListFilters {
  tab: 'my' | 'assigned' | 'shared' | 'all';
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
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Read initial filter values from URL search params (falling back to initialFilters or defaults)
  const getInitialFilters = (): TicketListFilters => {
    const urlTab = searchParams.get('tab') as TicketListFilters['tab'] | null;
    const validTabs: TicketListFilters['tab'][] = ['my', 'assigned', 'shared', 'all'];
    const tab = (urlTab && validTabs.includes(urlTab)) ? urlTab : (initialFilters?.tab || 'my');

    return {
      tab,
      status: searchParams.get('status') ?? initialFilters?.status ?? '',
      mappedState: searchParams.get('mappedState') ?? initialFilters?.mappedState ?? '',
      assigneeId: searchParams.get('assigneeId') ?? initialFilters?.assigneeId ?? '',
      priority: searchParams.get('priority') ?? initialFilters?.priority ?? '',
      search: searchParams.get('search') ?? initialFilters?.search ?? '',
    };
  };

  const getInitialPage = (): number => {
    const p = searchParams.get('page');
    return p ? Math.max(0, parseInt(p, 10)) : 0;
  };

  const getInitialSize = (): number => {
    const s = searchParams.get('size');
    return s ? Math.max(1, parseInt(s, 10)) : APP_CONFIG.TICKETS.DEFAULT_PAGE_SIZE;
  };

  const getInitialSort = (): string => {
    return searchParams.get('sort') || APP_CONFIG.TICKETS.DEFAULT_SORT;
  };

  const [filters, setFilters] = useState<TicketListFilters>(getInitialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [page, setPage] = useState<number>(getInitialPage);
  const [size, setSize] = useState<number>(getInitialSize);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [sort, setSortState] = useState<string>(getInitialSort);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state to URL search parameters
  const syncToUrl = useCallback(
    (newFilters: TicketListFilters, newPage: number, newSize: number, newSort: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          if (newFilters.tab && newFilters.tab !== 'my') {
            next.set('tab', newFilters.tab);
          } else {
            next.delete('tab');
          }

          if (newFilters.status) {
            next.set('status', newFilters.status);
          } else {
            next.delete('status');
          }

          if (newFilters.mappedState) {
            next.set('mappedState', newFilters.mappedState);
          } else {
            next.delete('mappedState');
          }

          if (newFilters.assigneeId) {
            next.set('assigneeId', newFilters.assigneeId);
          } else {
            next.delete('assigneeId');
          }

          if (newFilters.priority) {
            next.set('priority', newFilters.priority);
          } else {
            next.delete('priority');
          }

          if (newFilters.search) {
            next.set('search', newFilters.search);
          } else {
            next.delete('search');
          }

          if (newPage > 0) {
            next.set('page', String(newPage));
          } else {
            next.delete('page');
          }

          if (newSize !== APP_CONFIG.TICKETS.DEFAULT_PAGE_SIZE) {
            next.set('size', String(newSize));
          } else {
            next.delete('size');
          }

          if (newSort !== APP_CONFIG.TICKETS.DEFAULT_SORT) {
            next.set('sort', newSort);
          } else {
            next.delete('sort');
          }

          if (next.toString() === prev.toString()) {
            return prev;
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Respond to browser navigation (back/forward) changes in searchParams
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TicketListFilters['tab'] | null;
    const validTabs: TicketListFilters['tab'][] = ['my', 'assigned', 'shared', 'all'];
    const nextTab = (urlTab && validTabs.includes(urlTab)) ? urlTab : (initialFilters?.tab || 'my');
    const nextStatus = searchParams.get('status') ?? initialFilters?.status ?? '';
    const nextMappedState = searchParams.get('mappedState') ?? initialFilters?.mappedState ?? '';
    const nextAssigneeId = searchParams.get('assigneeId') ?? initialFilters?.assigneeId ?? '';
    const nextPriority = searchParams.get('priority') ?? initialFilters?.priority ?? '';
    const nextSearch = searchParams.get('search') ?? initialFilters?.search ?? '';
    const nextPage = searchParams.get('page') ? Math.max(0, parseInt(searchParams.get('page')!, 10)) : 0;
    const nextSize = searchParams.get('size') ? Math.max(1, parseInt(searchParams.get('size')!, 10)) : APP_CONFIG.TICKETS.DEFAULT_PAGE_SIZE;
    const nextSort = searchParams.get('sort') || APP_CONFIG.TICKETS.DEFAULT_SORT;

    setFilters((prev) => {
      if (
        prev.tab === nextTab &&
        prev.status === nextStatus &&
        prev.mappedState === nextMappedState &&
        prev.assigneeId === nextAssigneeId &&
        prev.priority === nextPriority &&
        prev.search === nextSearch
      ) {
        return prev;
      }
      return {
        tab: nextTab,
        status: nextStatus,
        mappedState: nextMappedState,
        assigneeId: nextAssigneeId,
        priority: nextPriority,
        search: nextSearch,
      };
    });

    setPage((prev) => (prev === nextPage ? prev : nextPage));
    setSize((prev) => (prev === nextSize ? prev : nextSize));
    setSortState((prev) => (prev === nextSort ? prev : nextSort));
  }, [searchParams, initialFilters]);

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
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        syncToUrl(next, 0, size, sort);
        return next;
      });
      setPage(0);
    },
    [size, sort, syncToUrl]
  );

  const resetFilters = useCallback(() => {
    setFilters((prev) => {
      const next: TicketListFilters = {
        tab: prev.tab,
        status: '',
        mappedState: '',
        assigneeId: '',
        priority: '',
        search: '',
      };
      syncToUrl(next, 0, size, sort);
      return next;
    });
    setPage(0);
  }, [size, sort, syncToUrl]);

  const setSort = useCallback((newSort: string) => {
    setSortState(newSort);
    setPage(0);
    syncToUrl(filters, 0, size, newSort);
  }, [filters, size, syncToUrl]);

  const handleSort = useCallback((field: string) => {
    setSortState((prev) => {
      const [currentField, currentDir] = prev.split(',');
      const nextSort = currentField === field
        ? `${field},${currentDir === 'asc' ? 'desc' : 'asc'}`
        : `${field},asc`;
      syncToUrl(filters, 0, size, nextSort);
      return nextSort;
    });
    setPage(0);
  }, [filters, size, syncToUrl]);

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
          const message = (err as ApiError)?.message || 'Failed to fetch tickets';
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
    setPage((p) => {
      const np = p < totalPages - 1 ? p + 1 : p;
      syncToUrl(filters, np, size, sort);
      return np;
    });
  }, [totalPages, filters, size, sort, syncToUrl]);

  const prevPage = useCallback(() => {
    setPage((p) => {
      const np = p > 0 ? p - 1 : p;
      syncToUrl(filters, np, size, sort);
      return np;
    });
  }, [filters, size, sort, syncToUrl]);

  const updateSize = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(0);
    syncToUrl(filters, 0, newSize, sort);
  }, [filters, sort, syncToUrl]);

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
    resetFilters,
    sort,
    setSort,
    handleSort,
    pagination,
    refetch,
  };
}

/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ticketApi } from '../../api/ticketApi';
import type { TicketSummaryDTO, TicketFilterParams } from '../../types/ticket';
import { useAuth } from '../../store/authStore';

export const TicketListPage = () => {
  const navigate = useNavigate();
  const { user, hasPrivilege } = useAuth();
  const canManage = hasPrivilege('TICKET_MANAGEMENT');
  
  const [tab, setTab] = useState<'my' | 'assigned' | 'all'>('my');
  const [tickets, setTickets] = useState<TicketSummaryDTO[]>([]);
  const [page, setPage] = useState(0);
  const size = 20;
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('createdAt,desc');
  
  const [loading, setLoading] = useState(false);
  
  const searchTimeoutRef = useRef<number | null>(null);

  const fetchTickets = useCallback(async (currentSearch: string) => {
    setLoading(true);
    try {
      const params: TicketFilterParams = {
        tab,
        page,
        size,
        sort,
      };
      
      if (tab === 'my' && user?.id) {
        params.requesterId = user.id;
      }
      if (tab === 'assigned' && user?.id) {
        params.assigneeId = user.id;
      }
      if (status) {
        params.status = status as 'OPEN' | 'CLOSED';
      }
      if (priority) {
        params.priority = Number(priority);
      }
      if (currentSearch) {
        params.search = currentSearch;
      }
      
      const res = await ticketApi.getTickets(params);
      setTickets(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, page, size, sort, status, priority, user]);

  useEffect(() => {
    fetchTickets(search);
  }, [fetchTickets]); // search intentionally excluded to debounce
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setPage(0);
      fetchTickets(val);
    }, 300);
  };
  
  const handleSort = (field: string) => {
    const [currentField, currentDir] = sort.split(',');
    if (currentField === field) {
      setSort(`${field},${currentDir === 'asc' ? 'desc' : 'asc'}`);
    } else {
      setSort(`${field},asc`);
    }
    setPage(0);
  };
  
  const renderSortIcon = (field: string) => {
    const [currentField, currentDir] = sort.split(',');
    if (currentField !== field) return null;
    return <span>{currentDir === 'asc' ? ' ▲' : ' ▼'}</span>;
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ticket Dashboard</h1>
      
      <div className="flex space-x-4 mb-4 border-b">
        <button 
          className={`py-2 px-4 ${tab === 'my' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => { setTab('my'); setPage(0); }}
        >
          My Tickets
        </button>
        <button 
          className={`py-2 px-4 ${tab === 'assigned' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => { setTab('assigned'); setPage(0); }}
        >
          Assigned to Me
        </button>
        {canManage && (
          <button 
            className={`py-2 px-4 ${tab === 'all' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
            onClick={() => { setTab('all'); setPage(0); }}
          >
            All Tickets
          </button>
        )}
      </div>
      
      <div className="flex space-x-4 mb-4 items-center">
        <input 
          type="text" 
          placeholder="Search by ID or Requester" 
          value={search}
          onChange={handleSearchChange}
          className="border p-2 rounded"
        />
        
        <select 
          value={status} 
          onChange={e => { setStatus(e.target.value); setPage(0); }}
          className="border p-2 rounded"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select 
          value={priority} 
          onChange={e => { setPriority(e.target.value); setPage(0); }}
          className="border p-2 rounded"
        >
          <option value="">All Priorities</option>
          <option value="1">1 - Critical</option>
          <option value="2">2 - High</option>
          <option value="3">3 - Medium</option>
          <option value="4">4 - Low</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border text-left">ID</th>
              <th className="py-2 px-4 border text-left">Type</th>
              <th className="py-2 px-4 border text-left">Requester</th>
              <th className="py-2 px-4 border text-left">Assignee</th>
              <th className="py-2 px-4 border text-left">Status</th>
              <th className="py-2 px-4 border text-left cursor-pointer" onClick={() => handleSort('priority')}>
                Priority {renderSortIcon('priority')}
              </th>
              <th className="py-2 px-4 border text-left cursor-pointer" onClick={() => handleSort('slaDueAt')}>
                SLA {renderSortIcon('slaDueAt')}
              </th>
              <th className="py-2 px-4 border text-left cursor-pointer" onClick={() => handleSort('createdAt')}>
                Created {renderSortIcon('createdAt')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-4">No tickets found.</td></tr>
            ) : (
              tickets.map(t => (
                <tr 
                  key={t.id} 
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/tickets/${t.id}`)}
                >
                  <td className="py-2 px-4 border">{t.id.substring(0, 8)}...</td>
                  <td className="py-2 px-4 border">
                    <div>{t.ticketTypeTitle}</div>
                    <div className="text-xs text-gray-500">{t.departmentName}</div>
                  </td>
                  <td className="py-2 px-4 border">{t.requesterName}</td>
                  <td className="py-2 px-4 border">
                    {t.assigneeName || <span className="bg-gray-200 text-xs px-2 py-1 rounded-full">Unassigned</span>}
                  </td>
                  <td className="py-2 px-4 border">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {t.statusName} ({t.mappedState})
                    </span>
                  </td>
                  <td className="py-2 px-4 border">
                    {t.priority === 1 && <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">1 - Critical</span>}
                    {t.priority === 2 && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">2 - High</span>}
                    {t.priority === 3 && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">3 - Medium</span>}
                    {t.priority === 4 && <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">4 - Low</span>}
                  </td>
                  <td className="py-2 px-4 border">
                    {t.slaBreached ? (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">Breached</span>
                    ) : (
                      <span>{t.slaDueAt ? new Date(t.slaDueAt).toLocaleString() : ''}</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {totalElements === 0 ? 0 : page * size + 1}-{Math.min((page + 1) * size, totalElements)} of {totalElements} tickets
        </div>
        <div className="flex space-x-2">
          <button 
            disabled={page === 0} 
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50 cursor-pointer"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {totalPages > 0 ? page + 1 : 0} of {totalPages}</span>
          <button 
            disabled={page >= totalPages - 1} 
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

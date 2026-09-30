import { ROUTES } from '../../constants';
import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../store/authStore';
import { useTicketList } from '../../hooks';
import { APP_CONFIG } from '../../constants';

export const TicketListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPrivilege } = useAuth();
  const canManage = hasPrivilege('TICKET_MANAGEMENT');

  const {
    tickets,
    loading,
    filters,
    setFilter,
    sort,
    handleSort,
    pagination,
  } = useTicketList();

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
          className={`py-2 px-4 ${filters.tab === 'my' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setFilter('tab', 'my')}
        >
          My Tickets
        </button>
        <button
          className={`py-2 px-4 ${filters.tab === 'assigned' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setFilter('tab', 'assigned')}
        >
          Assigned to Me
        </button>
        {canManage && (
          <button
            className={`py-2 px-4 ${filters.tab === 'all' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
            onClick={() => setFilter('tab', 'all')}
          >
            All Tickets
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by ID or Requester"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Filter by Status ID"
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Filter by Assignee ID"
          value={filters.assigneeId}
          onChange={(e) => setFilter('assigneeId', e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={filters.mappedState}
          onChange={(e) => setFilter('mappedState', e.target.value)}
          className="border p-2 rounded"
        >
          {APP_CONFIG.TICKETS.STATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilter('priority', e.target.value)}
          className="border p-2 rounded"
        >
          {APP_CONFIG.TICKETS.PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={pagination.size}
          onChange={(e) => pagination.setSize(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {APP_CONFIG.TICKETS.PAGE_SIZE_OPTIONS.map((sz) => (
            <option key={sz} value={sz}>
              {sz} per page
            </option>
          ))}
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
              <th
                className="py-2 px-4 border text-left cursor-pointer"
                onClick={() => handleSort('priority')}
              >
                Priority {renderSortIcon('priority')}
              </th>
              <th
                className="py-2 px-4 border text-left cursor-pointer"
                onClick={() => handleSort('slaDueAt')}
              >
                SLA {renderSortIcon('slaDueAt')}
              </th>
              <th
                className="py-2 px-4 border text-left cursor-pointer"
                onClick={() => handleSort('createdAt')}
              >
                Created {renderSortIcon('createdAt')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(ROUTES.TICKETS.DETAILS(t.id))}
                  className="hover:bg-gray-50 cursor-pointer"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(ROUTES.TICKETS.DETAILS(t.id))}
                >
                  <td className="py-2 px-4 border">{t.id.substring(0, 8)}...</td>
                  <td className="py-2 px-4 border">
                    <div>{t.ticketTypeTitle}</div>
                  </td>
                  <td className="py-2 px-4 border">{t.requesterName}</td>
                  <td className="py-2 px-4 border">
                    {t.assigneeName || (
                      <span className="bg-gray-200 text-xs px-2 py-1 rounded-full">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {t.currentStatusName} ({t.mappedState})
                    </span>
                  </td>
                  <td className="py-2 px-4 border">
                    {t.priority === 1 && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                        1 - Critical
                      </span>
                    )}
                    {t.priority === 2 && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                        2 - High
                      </span>
                    )}
                    {t.priority === 3 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        3 - Medium
                      </span>
                    )}
                    {t.priority === 4 && (
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                        4 - Low
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    {t.slaBreached ? (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                        Breached
                      </span>
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
          Showing {pagination.totalElements === 0 ? 0 : pagination.page * pagination.size + 1}-
          {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of{' '}
          {pagination.totalElements} tickets
        </div>
        <div className="flex space-x-2">
          <button
            disabled={pagination.page === 0}
            onClick={pagination.prevPage}
            className="px-4 py-2 border rounded disabled:opacity-50 cursor-pointer"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.totalPages > 0 ? pagination.page + 1 : 0} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={pagination.nextPage}
            className="px-4 py-2 border rounded disabled:opacity-50 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

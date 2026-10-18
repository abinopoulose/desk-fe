import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Building2,
  Trash2,
  Share2,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { ticketApi } from '../../api/ticketApi';
import { getOrgUsers } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import type { TicketAccessListDTO, TicketShareDTO } from '../../types/ticket';
import type { User } from '../../types/user';
import type { DepartmentDTO } from '../../types/department';

interface TicketAccessCardProps {
  ticketId: string;
  refreshTrigger?: number;
  onAccessChanged?: () => void;
}

export const TicketAccessCard: React.FC<TicketAccessCardProps> = ({
  ticketId,
  refreshTrigger,
  onAccessChanged,
}) => {
  const [accessList, setAccessList] = useState<TicketAccessListDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Share modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareTab, setShareTab] = useState<'USER' | 'DEPARTMENT'>('USER');
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [sharing, setSharing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch access list
  const fetchAccess = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ticketApi.getTicketAccess(ticketId);
      setAccessList(data);
    } catch (err) {
      console.error('Failed to load ticket access list', err);
      setError('Unable to load ticket access details');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess, refreshTrigger]);

  // Open modal and load candidate users / departments
  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setModalError(null);
    try {
      const [users, depts] = await Promise.all([
        getOrgUsers(),
        departmentApi.getAllDepartments()
      ]);
      setOrgUsers(users);
      setDepartments(depts);

      // Pre-select first available user
      const existingUserIds = new Set<string>();
      if (accessList?.requester) existingUserIds.add(accessList.requester.id);
      if (accessList?.assignee) existingUserIds.add(accessList.assignee.id);
      accessList?.sharedUsers.forEach((u) => existingUserIds.add(u.targetId));

      const availableUsers = users.filter((u) => !existingUserIds.has(u.id) && u.status === 'ACTIVE');
      if (availableUsers.length > 0) {
        setSelectedUserId(availableUsers[0].id);
      } else {
        setSelectedUserId('');
      }

      // Pre-select first available department
      const existingDeptIds = new Set<string>();
      if (accessList?.primaryDepartment) existingDeptIds.add(accessList.primaryDepartment.id);
      accessList?.sharedDepartments.forEach((d) => existingDeptIds.add(d.targetId));

      const availableDepts = depts.filter((d) => !existingDeptIds.has(d.id));
      if (availableDepts.length > 0) {
        setSelectedDeptId(availableDepts[0].id);
      } else {
        setSelectedDeptId('');
      }
    } catch (err) {
      console.error('Failed to load candidates for sharing', err);
      setModalError('Failed to load organization members or departments');
    }
  };

  // Filtered available users for select
  const availableUsers = useMemo(() => {
    const existingUserIds = new Set<string>();
    if (accessList?.requester) existingUserIds.add(accessList.requester.id);
    if (accessList?.assignee) existingUserIds.add(accessList.assignee.id);
    accessList?.sharedUsers?.forEach((u) => existingUserIds.add(u.targetId));
    return orgUsers.filter((u) => !existingUserIds.has(u.id) && u.status === 'ACTIVE');
  }, [orgUsers, accessList]);

  // Filtered available departments for select
  const availableDepartments = useMemo(() => {
    const existingDeptIds = new Set<string>();
    if (accessList?.primaryDepartment) existingDeptIds.add(accessList.primaryDepartment.id);
    accessList?.sharedDepartments?.forEach((d) => existingDeptIds.add(d.targetId));
    return departments.filter((d) => !existingDeptIds.has(d.id));
  }, [departments, accessList]);

  // Submit Share
  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    const targetId = shareTab === 'USER' ? selectedUserId : selectedDeptId;
    if (!targetId) {
      setModalError(`Please select a ${shareTab === 'USER' ? 'user' : 'department'} to share with.`);
      return;
    }

    setSharing(true);
    try {
      await ticketApi.shareTicket(ticketId, {
        shareType: shareTab,
        targetId,
      });
      setIsModalOpen(false);
      setActionSuccess(`Ticket shared with ${shareTab === 'USER' ? 'user' : 'department'} successfully.`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchAccess();
      onAccessChanged?.();
    } catch (err: unknown) {
      console.error('Failed to share ticket', err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      setModalError(errorObj.response?.data?.message || 'Failed to share ticket');
    } finally {
      setSharing(false);
    }
  };

  // Remove share
  const handleRemoveShare = async (share: TicketShareDTO) => {
    try {
      await ticketApi.unshareTicket(ticketId, share.shareType, share.targetId);
      setActionSuccess(`Removed access for ${share.targetName}.`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchAccess();
      onAccessChanged?.();
    } catch (err) {
      console.error('Failed to remove share', err);
      alert('Failed to remove share');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Access & Sharing</h3>
            <p className="text-[11px] text-slate-400">People & teams who can view, edit, and comment</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          title="Share ticket with a user or department"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Loading access list...</span>
        </div>
      ) : error ? (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : accessList ? (
        <div className="space-y-4 text-xs">

          {/* Section 1: Core Participants (Creator, Specialist, and Added Users) */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Core Participants
            </span>

            {/* Requester */}
            {accessList.requester && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {accessList.requester.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 truncate">
                      {accessList.requester.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {accessList.requester.email}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 shrink-0">
                  Creator
                </span>
              </div>
            )}

            {/* Specialist / Assignee */}
            {accessList.assignee && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {accessList.assignee.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 truncate">
                      {accessList.assignee.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {accessList.assignee.email}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 shrink-0">
                  Specialist
                </span>
              </div>
            )}

            {/* Shared Users / Added Teammates */}
            {accessList.sharedUsers.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 hover:bg-slate-50 border border-slate-100 group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {share.targetName ? share.targetName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 truncate">
                      {share.targetName}
                    </div>
                    {share.targetEmail && (
                      <div className="text-[10px] text-slate-400 truncate">
                        {share.targetEmail}
                      </div>
                    )}
                    <div className="text-[9px] text-slate-400 italic">
                      Shared by {share.sharedByUserName || 'team'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                    Participant
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveShare(share)}
                    title="Remove access"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Section 2: Department Access */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Department Access
            </span>

            {/* Primary Department */}
            {accessList.primaryDepartment && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 truncate">
                      {accessList.primaryDepartment.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      All department members & admins
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0">
                  Dept Team
                </span>
              </div>
            )}

            {/* Shared Departments */}
            {accessList.sharedDepartments.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 hover:bg-slate-50 border border-slate-100 group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-xs shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 truncate">
                      {share.targetName}
                    </div>
                    <div className="text-[9px] text-slate-400 italic">
                      Shared by {share.sharedByUserName || 'team'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                    Shared Dept
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveShare(share)}
                    title="Remove access"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Share Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                Share Ticket Access
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Anyone with access can view details, add comments, and share the ticket with more teammates.
            </p>

            {/* Tab switch: User vs Department */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setShareTab('USER')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  shareTab === 'USER'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Individual User
              </button>
              <button
                type="button"
                onClick={() => setShareTab('DEPARTMENT')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  shareTab === 'DEPARTMENT'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Entire Department
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleShareSubmit} className="space-y-4">
              {shareTab === 'USER' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Select Teammate
                  </label>
                  {availableUsers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      All active teammates already have access to this ticket.
                    </p>
                  ) : (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Select Department
                  </label>
                  {availableDepartments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      All departments already have access to this ticket.
                    </p>
                  ) : (
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {availableDepartments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.description ? `— ${d.description}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing || (shareTab === 'USER' ? availableUsers.length === 0 : availableDepartments.length === 0)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {sharing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{sharing ? 'Sharing...' : 'Share Access'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

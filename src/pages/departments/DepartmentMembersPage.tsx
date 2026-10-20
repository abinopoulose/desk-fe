import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Trash2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { departmentApi } from '../../api/departmentApi';
import { getOrgUsers } from '../../api/employeeApi';
import { useAuth } from '../../store/authStore';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DepartmentHeaderNav } from './DepartmentHeaderNav';
import { ROUTES } from '../../constants';
import { getUserInitial } from '../../utils/userUtils';
import type {
  MyDepartmentDTO,
  DepartmentDTO,
  DepartmentMemberDTO,
} from '../../types/department';
import type { User } from '../../types/user';

const PAGE_SIZE = 50;

export const DepartmentMembersPage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin, hasPrivilege } = useAuth();
  const canEditAnyDept = isSuperAdmin || hasPrivilege('DEPARTMENT_EDIT');

  // Department state
  const [department, setDepartment] = useState<MyDepartmentDTO | DepartmentDTO | null>(null);
  const [myDepartments, setMyDepartments] = useState<MyDepartmentDTO[]>([]);
  const [myRole, setMyRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  const [loadingDept, setLoadingDept] = useState(true);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Members state
  const [members, setMembers] = useState<DepartmentMemberDTO[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Filtering & Pagination state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MEMBER'>('ALL');
  const [page, setPage] = useState(0);

  // Add Member Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [userSearchText, setUserSearchText] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [addingMember, setAddingMember] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // Remove Member Confirm Dialog state
  const [memberToRemove, setMemberToRemove] = useState<DepartmentMemberDTO | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Promote / Demote Action state
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  // Fetch department details & user role
  const fetchDepartmentInfo = useCallback(async () => {
    if (!departmentId) return;
    setLoadingDept(true);
    setDeptError(null);
    try {
      const myDepts = await departmentApi.getMyDepartments();
      setMyDepartments(myDepts);
      const current = myDepts.find((d) => d.id === departmentId);
      if (current) {
        setDepartment(current);
        setMyRole(current.myRole);
      } else {
        const dept = await departmentApi.getDepartmentById(departmentId);
        setDepartment(dept);
        if (canEditAnyDept) {
          setMyRole('ADMIN');
        } else {
          setMyRole(null);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load department info', err);
      setDeptError('Failed to load department information.');
    } finally {
      setLoadingDept(false);
    }
  }, [departmentId, canEditAnyDept]);

  useEffect(() => {
    fetchDepartmentInfo();
  }, [fetchDepartmentInfo]);

  // Fetch department members
  const fetchMembers = useCallback(async () => {
    if (!departmentId) return;
    setLoadingMembers(true);
    setMemberError(null);
    try {
      const data = await departmentApi.getDepartmentMembers(departmentId);
      setMembers(data);
    } catch (err: unknown) {
      console.error('Failed to load members', err);
      setMemberError('Failed to load department personnel.');
    } finally {
      setLoadingMembers(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Filter members by search (name, email) and role
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Role filter
      if (roleFilter !== 'ALL' && m.role !== roleFilter) {
        return false;
      }

      // Search filter (name or email)
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const matchName = m.fullName?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      return Boolean(matchName || matchEmail);
    });
  }, [members, search, roleFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
  const paginatedMembers = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, page]);

  // Open Add Member Modal & fetch org users
  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    setSelectedUserId('');
    setSelectedRole('MEMBER');
    setUserSearchText('');
    setAddModalError(null);
    try {
      const users = await getOrgUsers();
      setOrgUsers(users);
    } catch (err) {
      console.error('Failed to load organization users', err);
      setAddModalError('Failed to load user directory.');
    }
  };

  // Add Member submit
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId || !selectedUserId) return;
    setAddingMember(true);
    setAddModalError(null);
    try {
      await departmentApi.addDepartmentMember(departmentId, {
        userId: selectedUserId,
        role: selectedRole,
      });
      setIsAddModalOpen(false);
      await fetchMembers();
    } catch (err: any) {
      console.error('Failed to add member', err);
      setAddModalError(err?.response?.data?.message || 'Failed to add member to department.');
    } finally {
      setAddingMember(false);
    }
  };

  // Promote / Demote member
  const handleToggleMemberRole = async (member: DepartmentMemberDTO) => {
    if (!departmentId) return;
    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const actionLabel = newRole === 'ADMIN' ? 'promote' : 'demote';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${member.fullName} to ${newRole}?`)) {
      return;
    }

    setUpdatingMemberId(member.userId);
    try {
      await departmentApi.updateDepartmentMemberRole(departmentId, member.userId, {
        role: newRole,
      });
      await fetchMembers();
    } catch (err: any) {
      console.error('Failed to update member role', err);
      alert(err?.response?.data?.message || 'Failed to update member role.');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Remove member confirm
  const handleConfirmRemoveMember = async () => {
    if (!departmentId || !memberToRemove) return;
    setRemovingMember(true);
    try {
      await departmentApi.removeDepartmentMember(departmentId, memberToRemove.userId);
      setMemberToRemove(null);
      await fetchMembers();
    } catch (err: any) {
      console.error('Failed to remove member', err);
      alert(err?.response?.data?.message || 'Failed to remove member.');
    } finally {
      setRemovingMember(false);
    }
  };

  // Available users not yet members
  const availableUsers = useMemo(() => {
    const existingUserIds = new Set(members.map((m) => m.userId));
    const term = userSearchText.trim().toLowerCase();
    return orgUsers.filter((u) => {
      if (existingUserIds.has(u.id)) return false;
      if (!term) return true;
      return (
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    });
  }, [orgUsers, members, userSearchText]);

  const isCurrentDeptAdmin = canEditAnyDept || myRole === 'ADMIN';

  if (loadingDept) {
    return (
      <div className="min-h-full bg-slate-50 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Loading department...</span>
        </div>
      </div>
    );
  }

  if (deptError || !department) {
    return (
      <div className="min-h-full bg-slate-50 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-red-900">Department Not Found</h2>
          <p className="text-xs text-red-700 max-w-md mx-auto">
            {deptError || 'We could not locate this department.'}
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.DEPARTMENT_TICKETS)}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
          >
            Back to Department Tickets
          </button>
        </div>
      </div>
    );
  }

  // Access gate: Must be assigned to this department or have admin privileges
  const isMemberOfDept = Boolean(myRole) || isCurrentDeptAdmin;
  if (!isMemberOfDept) {
    return (
      <div className="min-h-full bg-slate-50 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-amber-900">Membership Required</h2>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            You are not assigned to this department. Only department members and administrators can view this team roster.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.DEPARTMENT_TICKETS)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Back to Department Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      {/* Shared Department Header Nav */}
      <DepartmentHeaderNav
        departmentId={department.id}
        departmentName={department.name}
        description={department.description}
        alphaTags={department.alphaTags}
        myRole={myRole}
        activeTab="members"
        isAdmin={isCurrentDeptAdmin}
        myDepartments={myDepartments}
      />

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6">
        {/* Controls Toolbar: Search, Role Filter & Add Member */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input (Name or Email) */}
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Role Filter Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Filter members by role"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as 'ALL' | 'ADMIN' | 'MEMBER');
                  setPage(0);
                }}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins Only</option>
                <option value="MEMBER">Members Only</option>
              </select>
            </div>

            {(search || roleFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('ALL');
                  setPage(0);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchMembers}
              disabled={loadingMembers}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              title="Refresh member list"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMembers ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Add Member Button - Admin Only */}
            {isCurrentDeptAdmin && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Member Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loadingMembers ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading department personnel...</p>
            </div>
          ) : memberError ? (
            <div className="p-8 text-center text-red-600 text-xs font-semibold">
              <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              {memberError}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Members Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {search || roleFilter !== 'ALL'
                  ? 'No members match your search or role filter criteria.'
                  : 'This department currently has no assigned members.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Member</th>
                    <th className="py-3.5 px-4 font-semibold">Email</th>
                    <th className="py-3.5 px-4 font-semibold">Role</th>
                    <th className="py-3.5 px-4 font-semibold">Joined At</th>
                    {isCurrentDeptAdmin && <th className="py-3.5 px-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedMembers.map((m) => {
                    const isSelf = m.userId === user?.id;
                    const isMemberAdmin = m.role === 'ADMIN';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member Name & Profile Picture */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {m.profilePictureUrl ? (
                              <img
                                src={m.profilePictureUrl}
                                alt={m.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                {getUserInitial(m.fullName)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{m.fullName}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              {m.displayId && (
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {m.displayId}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                          {m.email}
                        </td>

                        {/* Role Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isMemberAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <Shield className="w-3 h-3 text-slate-500" />
                              Member
                            </span>
                          )}
                        </td>

                        {/* Joined At */}
                        <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                          {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }) : '—'}
                        </td>

                        {/* Actions (Promote/Demote & Remove) - Admin Only */}
                        {isCurrentDeptAdmin && (
                          <td className="py-4 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Promote / Demote Button */}
                              <button
                                type="button"
                                disabled={updatingMemberId === m.userId}
                                onClick={() => handleToggleMemberRole(m)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                                  isMemberAdmin
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                }`}
                                title={isMemberAdmin ? 'Demote to regular Member' : 'Promote to department Admin'}
                              >
                                <ArrowUpDown className="w-3 h-3" />
                                <span>{isMemberAdmin ? 'Demote' : 'Promote'}</span>
                              </button>

                              {/* Remove Member Button */}
                              <button
                                type="button"
                                onClick={() => setMemberToRemove(m)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove member from department"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls (Paginates after 50 members as specified) */}
          {!loadingMembers && filteredMembers.length > PAGE_SIZE && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing{' '}
                <strong className="text-slate-900">
                  {page * PAGE_SIZE + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900">
                  {Math.min((page + 1) * PAGE_SIZE, filteredMembers.length)}
                </strong>{' '}
                of <strong className="text-slate-900">{filteredMembers.length}</strong> members
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Showing total count when <= 50 */}
          {!loadingMembers && filteredMembers.length > 0 && filteredMembers.length <= PAGE_SIZE && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-right">
              Showing all {filteredMembers.length} members
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Add Department Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {addModalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{addModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              {/* Employee Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Filter by name or email..."
                  value={userSearchText}
                  onChange={(e) => setUserSearchText(e.target.value)}
                  className="w-full px-3 py-1.5 mb-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <select
                  aria-label="Select an employee"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Choose employee ({availableUsers.length} available) --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Department Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-medium transition-all ${
                      selectedRole === 'MEMBER'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="MEMBER"
                      checked={selectedRole === 'MEMBER'}
                      onChange={() => setSelectedRole('MEMBER')}
                      className="text-indigo-600"
                    />
                    <div>
                      <div>Member</div>
                      <div className="text-[10px] text-slate-500 font-normal">Can view & solve tickets</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-medium transition-all ${
                      selectedRole === 'ADMIN'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="ADMIN"
                      checked={selectedRole === 'ADMIN'}
                      onChange={() => setSelectedRole('ADMIN')}
                      className="text-indigo-600"
                    />
                    <div>
                      <div>Admin</div>
                      <div className="text-[10px] text-slate-500 font-normal">Can manage members & metrics</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember || !selectedUserId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Remove Member Dialog */}
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        title="Remove Department Member"
        description={`Are you sure you want to remove ${memberToRemove?.fullName} (${memberToRemove?.email}) from ${department.name}? They will no longer have access to this department queue.`}
        confirmLabel={removingMember ? 'Removing...' : 'Remove Member'}
        severity="danger"
        loading={removingMember}
        onConfirm={handleConfirmRemoveMember}
        onClose={() => setMemberToRemove(null)}
      />
    </div>
  );
};

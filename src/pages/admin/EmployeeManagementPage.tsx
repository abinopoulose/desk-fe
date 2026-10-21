import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Briefcase,
  Shield,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Pencil,
  ChevronDown,
} from 'lucide-react';
import { DataGridSkeleton } from '../../components/common/Skeletons';
import { PrivilegeGate } from '../../components/auth/PrivilegeGate';
import { useEmployeeManagement } from '../../hooks/useEmployeeManagement';
import { ROUTES } from '../../constants';
import { getUserSlug } from '../../utils/userUtils';
import type { InviteEmployeeRequest, User } from '../../types/user';

export const EmployeeManagementPage: React.FC = () => {
  const {
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
  } = useEmployeeManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendSuccessId, setResendSuccessId] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    fullName: string;
    title: string;
    managerId: string | null;
    isActive: boolean;
  }>({
    fullName: '',
    title: '',
    managerId: null,
    isActive: true,
  });
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // Pagination state: default 50 employees per page
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(50);

  // Reset page when search or filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, roleFilter]);


  const [inviteForm, setInviteForm] = useState<InviteEmployeeRequest>({
    email: '',
    fullName: '',
    title: '',
    roles: ['EMPLOYEE'],
  });

  const availableRoles = [
    { id: 'EMPLOYEE', label: 'Employee', desc: 'Standard staff access to browse services & raise tickets' },
    { id: 'IT_SUPPORT', label: 'Support Agent', desc: 'Can respond to, assign, and resolve department tickets' },
    { id: 'MANAGER', label: 'Department Manager', desc: 'Can oversee departmental queues and direct reports' },
  ];

  // Stats calculations
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => (u.status || 'ACTIVE') === 'ACTIVE').length;
    const pending = users.filter((u) => u.status === 'PENDING').length;
    const adminsAndAgents = users.filter((u) =>
      u.roles?.some((r) => ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'AGENT', 'IT_SUPPORT'].includes(r))
    ).length;
    return { total, active, pending, adminsAndAgents };
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = user.fullName.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        const matchesTitle = user.title?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesEmail && !matchesTitle) return false;
      }

      // Status filter
      const userStatus = user.status || 'ACTIVE';
      if (statusFilter !== 'ALL' && userStatus !== statusFilter) return false;

      // Role filter
      if (roleFilter !== 'ALL') {
        const matchesRole = user.roles?.some((r) => {
          if (r === roleFilter) return true;
          if (roleFilter === 'ADMIN' && (r === 'ORG_ADMIN' || r === 'SUPER_ADMIN')) return true;
          if (roleFilter === 'AGENT' && r === 'IT_SUPPORT') return true;
          if (roleFilter === 'USER' && r === 'EMPLOYEE') return true;
          if (roleFilter === 'EMPLOYEE' && r === 'USER') return true;
          if (roleFilter === 'IT_SUPPORT' && r === 'AGENT') return true;
          if (roleFilter === 'ORG_ADMIN' && r === 'ADMIN') return true;
          return false;
        });
        if (!matchesRole) return false;
      }

      return true;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = page * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleResend = async (userId: string) => {
    setResendingId(userId);
    try {
      await handleResendInvite(userId);
      setResendSuccessId(userId);
      setTimeout(() => setResendSuccessId(null), 3000);
    } catch {
      // handled
    } finally {
      setResendingId(null);
    }
  };

  const onInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleInvite(inviteForm);
      setInviteForm({ email: '', fullName: '', title: '', roles: ['EMPLOYEE'] });
    } catch {
      // error handled by hook
    }
  };

  const handleRoleToggle = (role: string) => {
    setInviteForm((prev) => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles: roles.length > 0 ? roles : ['USER'] };
    });
  };

  const availableManagers = useMemo(() => {
    if (!editingUser) return [];
    return users.filter(
      (u) => u.id !== editingUser.id && (u.status || 'ACTIVE') === 'ACTIVE'
    );
  }, [users, editingUser]);

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName || '',
      title: user.title || '',
      managerId: user.managerId ?? null,
      isActive: (user.status || 'ACTIVE') === 'ACTIVE',
    });
    setEditModalError(null);
    setIsEditModalOpen(true);
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editForm.fullName.trim()) {
      setEditModalError('Full name is required');
      return;
    }
    setEditModalError(null);
    try {
      await handleUpdateEmployee(editingUser.id, {
        fullName: editForm.fullName.trim(),
        title: editForm.title.trim() || undefined,
        managerId: editForm.managerId || null,
        isActive: editForm.isActive,
        active: editForm.isActive,
      });
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch {
      // updateError is provided by hook
    }
  };

  return (
    <PrivilegeGate requiredPrivilege="USER_EDIT">
      <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8 space-y-6">
          
          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-sm" role="alert">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Total Employees</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-[11px] text-slate-400 mt-1">Staff accounts in system</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Active Staff</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
              <p className="text-[11px] text-slate-400 mt-1">Active registered accounts</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Pending Invites</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting employee onboarding</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Admins & Support</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.adminsAndAgents}</div>
              <p className="text-[11px] text-slate-400 mt-1">Agents and administrators</p>
            </div>
          </div>

          {/* Search Bar & Filter Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search staff by name, email, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'PENDING' ? 'bg-white text-amber-700 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Pending
                </button>
              </div>

              {/* Role Filter Selector */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="IT_SUPPORT">Support Agent</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Administrator</option>
              </select>

              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Employee</span>
              </button>
            </div>
          </div>

          {/* Table Card */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <DataGridSkeleton rows={6} columns={4} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No employees found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                  ? 'No employees match your search and filter criteria.'
                  : 'Start by inviting employees to your organization.'}
              </p>
              {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setRoleFilter('ALL');
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Invite First Employee
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-6">Employee</th>
                      <th className="py-3.5 px-6">Email Address</th>
                      <th className="py-3.5 px-6">Assigned Roles</th>
                      <th className="py-3.5 px-6">Account Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paginatedUsers.map((user) => {
                      const isActive = (user.status || 'ACTIVE') === 'ACTIVE';
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                          
                          {/* User Avatar & Name */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                {user.profilePictureUrl ? (
                                  <img
                                    src={user.profilePictureUrl}
                                    alt={user.fullName}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                                    {user.fullName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                    isActive ? 'bg-emerald-500' : 'bg-amber-400'
                                  }`}
                                />
                              </div>

                              <div className="min-w-0">
                                <Link
                                  to={ROUTES.USERS.PROFILE(getUserSlug(user))}
                                  className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block"
                                >
                                  {user.fullName}
                                </Link>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {user.displayId && (
                                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                      {user.displayId}
                                    </span>
                                  )}
                                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                    <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{user.title || 'Staff Member'}</span>
                                    {user.departmentName && (
                                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 ml-1">
                                        {user.departmentName}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email with copy */}
                          <td className="py-4 px-6 text-slate-600">
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span>{user.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(user.email)}
                                title="Copy Email"
                                className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                {copiedEmail === user.email ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Roles Badges */}
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role) => (
                                  <span
                                    key={role}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      role === 'ADMIN' || role === 'SUPER_ADMIN'
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : role === 'AGENT'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {role}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No roles</span>
                              )}
                            </div>
                          </td>

                          {/* Status Pill */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              <span>{isActive ? 'Active' : 'Pending Invite'}</span>
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-6 text-right space-x-2">
                            {user.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleResend(user.id)}
                                disabled={resendingId === user.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {resendSuccessId === user.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Sent!</span>
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className={`w-3 h-3 ${resendingId === user.id ? 'animate-spin' : ''}`} />
                                    <span>Resend</span>
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(user)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <Link
                              to={ROUTES.USERS.PROFILE(getUserSlug(user))}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <span>View Profile</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {filteredUsers.length > 0 && (
                <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing{' '}
                      <strong className="text-slate-900 font-semibold">{page * pageSize + 1}</strong>{' '}
                      to{' '}
                      <strong className="text-slate-900 font-semibold">
                        {Math.min((page + 1) * pageSize, filteredUsers.length)}
                      </strong>{' '}
                      of{' '}
                      <strong className="text-slate-900 font-semibold">{filteredUsers.length}</strong>{' '}
                      employees
                    </span>
                    {filteredUsers.length > 50 && (
                      <div className="hidden md:flex items-center gap-1.5 ml-3 border-l border-slate-200 pl-3">
                        <span className="text-slate-400">Per page:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(0);
                          }}
                          className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={page <= 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                        title="Previous page"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-2 font-medium text-slate-700">
                        Page {page + 1} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page + 1 >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                        title="Next page"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* INVITE EMPLOYEE MODAL */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Invite Team Member</h2>
                    <p className="text-[11px] text-slate-500">Send an onboarding invite to an employee</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inviteError && (
                <div className="m-5 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              <form onSubmit={onInviteSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. employee@company.com"
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 outline-none"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 outline-none"
                      value={inviteForm.fullName}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Title (Optional)
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. HR Generalist, Support Specialist"
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 outline-none"
                      value={inviteForm.title}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    System Roles <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {availableRoles.map((role) => {
                      const isSelected = inviteForm.roles.includes(role.id);
                      return (
                        <div
                          key={role.id}
                          onClick={() => handleRoleToggle(role.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by div
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 pointer-events-none"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{role.label}</span>
                            <span className="text-[11px] text-slate-500">{role.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {inviteLoading ? 'Sending Invite...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT EMPLOYEE MODAL */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Edit Employee</h2>
                    <p className="text-[11px] text-slate-500">Update employee profile and account settings</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(editModalError || updateError) && (
                <div className="m-5 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editModalError || updateError}</span>
                </div>
              )}

              <form onSubmit={onEditSubmit} className="p-6 space-y-4">
                {/* Email Address (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      disabled
                      value={editingUser.email}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-500 cursor-not-allowed select-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Email is used for sign-in and cannot be modified here.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 outline-none"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 outline-none"
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Reporting Manager */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reporting Manager
                  </label>
                  <div className="relative">
                    <select
                      aria-label="Reporting Manager"
                      value={editForm.managerId || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          managerId: e.target.value ? e.target.value : null,
                        }))
                      }
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">-- No Manager (Root / Head of Org) --</option>
                      {availableManagers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} {m.title ? `— ${m.title}` : ''} ({m.email})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supervisor who approves requests and oversees this employee.
                  </p>
                </div>

                {/* Account Active Toggle */}
                <div
                  onClick={() => setEditForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  role="switch"
                  aria-checked={editForm.isActive}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setEditForm((prev) => ({ ...prev, isActive: !prev.isActive }));
                    }
                  }}
                  className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-colors select-none group focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 block">Account Active</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          editForm.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {editForm.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Inactive users cannot log in or submit tickets
                    </span>
                  </div>

                  <div className="relative inline-flex items-center shrink-0">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => {
                        e.stopPropagation();
                        setEditForm((prev) => ({ ...prev, isActive: e.target.checked }));
                      }}
                      className="sr-only"
                      aria-label="Account Active"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        editForm.isActive ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform duration-200 shadow-xs ${
                          editForm.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingUser(null);
                    }}
                    disabled={updateLoading}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {updateLoading ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PrivilegeGate>
  );
};

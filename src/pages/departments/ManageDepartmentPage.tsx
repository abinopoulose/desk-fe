import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Users,
  Search,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Trash2,
  BarChart2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw
} from 'lucide-react';
import { departmentApi } from '../../api/departmentApi';
import { getOrgUsers } from '../../api/employeeApi';
import { useAuth } from '../../store/authStore';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import type {
  MyDepartmentDTO,
  DepartmentMemberDTO,
  DepartmentMetricsDTO,
} from '../../types/department';
import type { User } from '../../types/user';

export const ManageDepartmentPage: React.FC = () => {
  const { user, isSuperAdmin, hasPrivilege } = useAuth();
  const canEditAnyDept = isSuperAdmin || hasPrivilege('DEPARTMENT_EDIT');

  // Department State
  const [departments, setDepartments] = useState<MyDepartmentDTO[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Tab State: 'members' | 'metrics'
  const [activeTab, setActiveTab] = useState<'members' | 'metrics'>('members');

  // Members State
  const [members, setMembers] = useState<DepartmentMemberDTO[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberError, setMemberError] = useState<string | null>(null);

  // Metrics State
  const [metrics, setMetrics] = useState<DepartmentMetricsDTO | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [addingMember, setAddingMember] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // Confirm Remove Member Dialog State
  const [memberToRemove, setMemberToRemove] = useState<DepartmentMemberDTO | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Fetch Departments
  const fetchDepartments = useCallback(async () => {
    setLoadingDepts(true);
    setDeptError(null);
    try {
      let myDepts = await departmentApi.getMyDepartments();
      
      // If user has zero memberships but has admin privileges, provide all departments with ADMIN role
      if (myDepts.length === 0 && canEditAnyDept) {
        const allDepts = await departmentApi.getAllDepartments();
        myDepts = allDepts.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          alphaTags: d.alphaTags,
          myRole: 'ADMIN' as const,
          memberCount: 0,
        }));
      }

      setDepartments(myDepts);
      if (myDepts.length > 0) {
        setSelectedDeptId((prev) => (prev && myDepts.some((d) => d.id === prev) ? prev : myDepts[0].id));
      } else {
        setSelectedDeptId(null);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch departments', err);
      setDeptError('Failed to load your departments. Please try again.');
    } finally {
      setLoadingDepts(false);
    }
  }, [canEditAnyDept]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const selectedDepartment = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  const isCurrentDeptAdmin = useMemo(() => {
    if (!selectedDepartment) return false;
    return selectedDepartment.myRole === 'ADMIN' || canEditAnyDept;
  }, [selectedDepartment, canEditAnyDept]);

  // Fetch Members for Selected Department
  const fetchMembers = useCallback(async (deptId: string, search?: string) => {
    setLoadingMembers(true);
    setMemberError(null);
    try {
      const data = await departmentApi.getDepartmentMembers(deptId, search);
      setMembers(data);
    } catch (err: unknown) {
      console.error('Failed to fetch department members', err);
      setMemberError('Failed to load department members.');
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // Fetch Metrics for Selected Department (Admin only)
  const fetchMetrics = useCallback(async (deptId: string) => {
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const data = await departmentApi.getDepartmentMetrics(deptId);
      setMetrics(data);
    } catch (err: unknown) {
      console.error('Failed to load department metrics', err);
      setMetricsError('Failed to load performance metrics.');
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // Effect when selected department or tab changes
  useEffect(() => {
    if (selectedDeptId) {
      if (activeTab === 'members') {
        fetchMembers(selectedDeptId, memberSearch);
      } else if (activeTab === 'metrics' && isCurrentDeptAdmin) {
        fetchMetrics(selectedDeptId);
      }
    }
  }, [selectedDeptId, activeTab, memberSearch, isCurrentDeptAdmin, fetchMembers, fetchMetrics]);

  // Open Add Member Modal
  const handleOpenAddModal = async () => {
    setAddModalError(null);
    setSelectedUserId('');
    setSelectedRole('MEMBER');
    setIsAddModalOpen(true);
    try {
      const users = await getOrgUsers();
      // Filter out users already in department
      const currentMemberUserIds = new Set(members.map((m) => m.userId));
      const available = users.filter((u) => !currentMemberUserIds.has(u.id) && u.status === 'ACTIVE');
      setOrgUsers(available);
      if (available.length > 0) {
        setSelectedUserId(available[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch org users', err);
      setAddModalError('Failed to load employee list.');
    }
  };

  // Submit Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId || !selectedUserId) return;
    setAddingMember(true);
    setAddModalError(null);
    try {
      await departmentApi.addDepartmentMember(selectedDeptId, {
        userId: selectedUserId,
        role: selectedRole,
      });
      setIsAddModalOpen(false);
      fetchMembers(selectedDeptId, memberSearch);
      fetchDepartments();
    } catch (err: unknown) {
      console.error('Failed to add department member', err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      setAddModalError(errorObj.response?.data?.message || 'Failed to add member to department.');
    } finally {
      setAddingMember(false);
    }
  };

  // Promote / Demote Role Toggle
  const handleToggleRole = async (member: DepartmentMemberDTO) => {
    if (!selectedDeptId) return;
    const nextRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      await departmentApi.updateDepartmentMemberRole(selectedDeptId, member.userId, {
        role: nextRole,
      });
      fetchMembers(selectedDeptId, memberSearch);
      fetchDepartments();
    } catch (err: unknown) {
      console.error('Failed to update member role', err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Failed to update department role.');
    }
  };

  // Remove Member Execution
  const handleConfirmRemoveMember = async () => {
    if (!selectedDeptId || !memberToRemove) return;
    setRemovingMember(true);
    try {
      await departmentApi.removeDepartmentMember(selectedDeptId, memberToRemove.userId);
      setMemberToRemove(null);
      fetchMembers(selectedDeptId, memberSearch);
      fetchDepartments();
    } catch (err: unknown) {
      console.error('Failed to remove department member', err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Failed to remove member.');
    } finally {
      setRemovingMember(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Departments</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and manage department memberships, personnel roles, and performance metrics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchDepartments();
                if (selectedDeptId) fetchMembers(selectedDeptId, memberSearch);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {loadingDepts ? (
          <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : deptError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500 mb-2" />
            <p className="text-sm font-semibold">{deptError}</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Department Memberships</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You are currently not assigned to any department. Contact your organization administrator to be added as a member.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

            {/* Department Selection Sidebar */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                Your Departments ({departments.length})
              </h2>

              <div className="space-y-2">
                {departments.map((dept) => {
                  const isSelected = dept.id === selectedDeptId;
                  const isAdmin = dept.myRole === 'ADMIN';

                  return (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-500/10'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm text-slate-900">{dept.name}</div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAdmin
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isAdmin ? <Shield className="w-2.5 h-2.5" /> : null}
                          {dept.myRole}
                        </span>
                      </div>

                      {dept.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">
                          {dept.description}
                        </p>
                      )}

                      {dept.alphaTags && dept.alphaTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {dept.alphaTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-slate-100 text-slate-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Department Main Panel */}
            <div className="lg:col-span-3 space-y-6">
              {selectedDepartment && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  
                  {/* Department Banner & Tabs */}
                  <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-900">{selectedDepartment.name}</h2>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            selectedDepartment.myRole === 'ADMIN'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Role: {selectedDepartment.myRole}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedDepartment.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setActiveTab('members')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          activeTab === 'members'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Members Directory
                      </button>

                      {isCurrentDeptAdmin && (
                        <button
                          onClick={() => setActiveTab('metrics')}
                          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'metrics'
                              ? 'bg-white text-indigo-600 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          Performance Metrics
                        </button>
                      )}
                    </div>
                  </div>

                  {/* TAB 1: MEMBERS DIRECTORY */}
                  {activeTab === 'members' && (
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Search Box */}
                        <div className="relative flex-1 max-w-sm">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search members by name or email..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>

                        {/* Add Member Button (Admin Only) */}
                        {isCurrentDeptAdmin && (
                          <button
                            onClick={handleOpenAddModal}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add Member
                          </button>
                        )}
                      </div>

                      {loadingMembers ? (
                        <div className="py-16 text-center">
                          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                      ) : memberError ? (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl text-center">
                          {memberError}
                        </div>
                      ) : members.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          No members found in this department.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                                <th className="py-3 px-4">Member</th>
                                <th className="py-3 px-4">Email</th>
                                <th className="py-3 px-4">Department Role</th>
                                <th className="py-3 px-4">Joined At</th>
                                {isCurrentDeptAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {members.map((member) => {
                                const isAdmin = member.role === 'ADMIN';
                                const isSelf = member.userId === user?.id;

                                return (
                                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                                          {member.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                          <div className="font-semibold text-slate-900">
                                            {member.fullName}
                                            {isSelf && (
                                              <span className="ml-1.5 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">
                                                You
                                              </span>
                                            )}
                                          </div>
                                          {member.displayId && (
                                            <div className="text-[10px] text-slate-400 font-mono">
                                              {member.displayId}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>

                                    <td className="py-3 px-4 text-slate-600">{member.email}</td>

                                    <td className="py-3 px-4">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                          isAdmin
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}
                                      >
                                        {isAdmin ? (
                                          <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                        ) : (
                                          <Users className="w-3 h-3 text-slate-400" />
                                        )}
                                        {isAdmin ? 'Admin' : 'Member'}
                                      </span>
                                    </td>

                                    <td className="py-3 px-4 text-slate-400">
                                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}
                                    </td>

                                    {isCurrentDeptAdmin && (
                                      <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleRole(member)}
                                            title={isAdmin ? 'Demote to Member' : 'Promote to Admin'}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                              isAdmin
                                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                            }`}
                                          >
                                            <ArrowUpDown className="w-3 h-3" />
                                            {isAdmin ? 'Demote' : 'Promote'}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => setMemberToRemove(member)}
                                            title="Remove from Department"
                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
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
                    </div>
                  )}

                  {/* TAB 2: PERFORMANCE METRICS (Admin Only) */}
                  {activeTab === 'metrics' && isCurrentDeptAdmin && (
                    <div className="p-6 space-y-6">
                      {loadingMetrics ? (
                        <div className="py-16 text-center">
                          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                      ) : metricsError ? (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl text-center">
                          {metricsError}
                        </div>
                      ) : metrics ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                            {/* Total Tickets */}
                            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  Total Tickets
                                </span>
                                <FileText className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                                {metrics.totalTickets}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">All-time handled by department</p>
                            </div>

                            {/* Open Tickets */}
                            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  Open Tickets
                                </span>
                                <Clock className="w-4 h-4 text-amber-500" />
                              </div>
                              <div className="text-2xl font-extrabold text-amber-600 mt-2">
                                {metrics.openTickets}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">Currently in progress or pending</p>
                            </div>

                            {/* Closed Tickets */}
                            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  Closed Tickets
                                </span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div className="text-2xl font-extrabold text-emerald-600 mt-2">
                                {metrics.closedTickets}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">Resolved & closed tickets</p>
                            </div>

                            {/* SLA Breaches */}
                            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  SLA Breaches
                                </span>
                                <ShieldAlert className="w-4 h-4 text-rose-500" />
                              </div>
                              <div className="text-2xl font-extrabold text-rose-600 mt-2">
                                {metrics.slaBreachedCount}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">Tickets exceeding SLA resolution deadline</p>
                            </div>

                            {/* SLA Compliance Rate */}
                            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  SLA Compliance
                                </span>
                                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                              </div>
                              <div className="text-2xl font-extrabold text-indigo-600 mt-2">
                                {metrics.slaComplianceRate.toFixed(1)}%
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">Compliance target: 95%+</p>
                            </div>

                            {/* Avg Resolution Time */}
                            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  Avg Resolution Time
                                </span>
                                <Clock className="w-4 h-4 text-indigo-500" />
                              </div>
                              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                                {metrics.avgResolutionMinutes > 0
                                  ? `${(metrics.avgResolutionMinutes / 60).toFixed(1)} hrs`
                                  : 'N/A'}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">Mean duration to resolve</p>
                            </div>

                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                Add Member to {selectedDepartment?.name}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {addModalError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select User
                </label>
                {orgUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No available active users to add.</p>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {orgUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Department Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('MEMBER')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'MEMBER'
                        ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/10'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">Member</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      View, edit & comment on department tickets
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('ADMIN')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'ADMIN'
                        ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/10'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo-600" />
                      Admin
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Manage members, roles & view metrics
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember || orgUsers.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {addingMember ? 'Adding...' : 'Add to Department'}
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
        description={`Are you sure you want to remove ${memberToRemove?.fullName} from ${selectedDepartment?.name}? They will lose access to department tickets.`}
        confirmLabel={removingMember ? 'Removing...' : 'Remove Member'}
        severity="danger"
        loading={removingMember}
        onConfirm={handleConfirmRemoveMember}
        onClose={() => setMemberToRemove(null)}
      />
    </div>
  );
};

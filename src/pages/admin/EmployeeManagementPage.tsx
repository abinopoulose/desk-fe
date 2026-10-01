import React, { useState } from 'react';
import { useEmployeeManagement } from '../../hooks/useEmployeeManagement';
import { Link } from 'react-router';
import { ROUTES } from '../../constants';
import type { InviteEmployeeRequest } from '../../types/user';

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
    handleResendInvite
  } = useEmployeeManagement();

  const [inviteForm, setInviteForm] = useState<InviteEmployeeRequest>({
    email: '',
    fullName: '',
    title: '',
    roles: []
  });

  const onInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleInvite(inviteForm);
      setInviteForm({ email: '', fullName: '', title: '', roles: [] });
    } catch (err) {
      // error handled by hook
    }
  };

  const availableRoles = ['ADMIN', 'AGENT', 'USER']; // Exclude SUPER_ADMIN and ORG_ADMIN

  const handleRoleToggle = (role: string) => {
    setInviteForm(prev => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Employee Management</h1>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
        >
          Invite Employee
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="text-slate-500 animate-pulse">Loading employees...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-medium text-slate-600">Name</th>
                  <th className="p-4 font-medium text-slate-600">Email</th>
                  <th className="p-4 font-medium text-slate-600">Roles</th>
                  <th className="p-4 font-medium text-slate-600">Status</th>
                  <th className="p-4 font-medium text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{user.fullName}</div>
                      {user.title && <div className="text-sm text-slate-500">{user.title}</div>}
                    </td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <span key={role} className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {user.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      {user.status === 'PENDING' && (
                        <button
                          onClick={() => handleResendInvite(user.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Resend Invite
                        </button>
                      )}
                      <Link
                        to={ROUTES.USERS.PROFILE(user.id)}
                        className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Invite Employee</h2>
            
            {inviteError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {inviteError}
              </div>
            )}

            <form onSubmit={onInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  value={inviteForm.fullName}
                  onChange={e => setInviteForm(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  value={inviteForm.title}
                  onChange={e => setInviteForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Roles</label>
                <div className="space-y-2">
                  {availableRoles.map(role => (
                    <label key={role} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        checked={inviteForm.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                      />
                      <span className="text-sm text-slate-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

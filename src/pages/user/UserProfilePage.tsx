import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Briefcase,
  Shield,
  Camera,
  Copy,
  Check,
  Users,
  AlertCircle,
  X,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getOrgUsers } from '../../api/employeeApi';
import type { User } from '../../types/user';
import { ROUTES } from '../../constants';
import { getUserSlug } from '../../utils/userUtils';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const {
    profile,
    loading,
    error,
    isEditing,
    startEdit,
    cancelEdit,
    editForm,
    setField,
    save,
    saving,
    uploadPicture,
    refetch,
  } = useUserProfile(userId);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    getOrgUsers()
      .then((users) => {
        if (isMounted && Array.isArray(users)) {
          setOrgUsers(users);
        }
      })
      .catch(() => {
        // Silently ignore if fails in tests or offline
      });
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (profile?.email) {
      const slug = getUserSlug(profile);
      if (slug && userId !== slug) {
        navigate(ROUTES.USERS.PROFILE(slug), { replace: true });
      }
    }
  }, [profile, userId, navigate]);

  const availableManagers = React.useMemo(() => {
    if (!profile) return orgUsers;
    const reporteeIds = new Set((profile.reportees || []).map((r) => r.id));
    return orgUsers.filter((u) => u.id !== profile.id && !reporteeIds.has(u.id));
  }, [orgUsers, profile]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div data-testid="loading-skeleton" className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-44 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
          <div className="h-48 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  if (error === '404') {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">User Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested user profile does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate(ROUTES.ADMIN.EMPLOYEES)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Back to Employee Directory
        </button>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Profile</h2>
        <p className="text-xs text-rose-600 mb-6">{error}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 pb-16">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.ADMIN.EMPLOYEES)}
              className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Back to Employees"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link to={ROUTES.ADMIN.EMPLOYEES} className="hover:text-slate-900 transition-colors">
                Employees
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold truncate max-w-xs">{profile.fullName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* User Hero / Profile Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            
            {/* Avatar with Upload Action */}
            <div className="relative group w-24 h-24 shrink-0">
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt={profile.fullName}
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-3xl font-bold shadow-2xs">
                  {profile.fullName.charAt(0).toUpperCase()}
                </div>
              )}

              <label
                className={`absolute inset-0 bg-slate-900/60 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                  saving ? 'opacity-100' : ''
                }`}
                title="Change Profile Picture"
              >
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold tracking-wider uppercase">
                  {saving ? 'Saving...' : 'Upload'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={saving}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      uploadPicture(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">
                  {profile.fullName}
                </h1>

                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    profile.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {profile.isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null}
                  {profile.isActive ? 'Active Employee' : 'Inactive'}
                </span>
              </div>

              {/* Title / Role & Department */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.title || 'No Job Title Specified'}</span>
                </p>
                {profile.departmentName && (
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Department: {profile.departmentName}
                  </span>
                )}
              </div>

              {/* Contact Meta Details */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-700">{profile.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(profile.email)}
                    title="Copy Email"
                    className="text-slate-400 hover:text-indigo-600 transition-colors ml-1 cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">ID</span>
                  <span className="font-mono text-slate-700 font-semibold text-[11px]">{profile.displayId || `#${profile.id.slice(0, 8)}`}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(profile.displayId || profile.id)}
                    title="Copy Full ID"
                    className="text-slate-400 hover:text-indigo-600 transition-colors ml-1 cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Edit CTA button on desktop */}
            <div className="hidden sm:flex flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={startEdit}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Reporting Manager Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Reporting Manager</h2>
                  <p className="text-[11px] text-slate-500">Direct supervisor in organizational hierarchy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={startEdit}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>{profile.manager ? 'Change' : 'Assign'}</span>
              </button>
            </div>

            {profile.manager ? (
              <Link
                to={ROUTES.USERS.PROFILE(getUserSlug(profile.manager))}
                className="group flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {profile.manager.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {profile.manager.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-500">{profile.manager.title || 'No Title'}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{profile.manager.email}</p>
                  </div>
                </div>

                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
              </Link>
            ) : (
              <div className="p-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-600">No Manager Assigned</p>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-3">This user is at root level of the org chart</p>
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Assign Manager</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Assigned Roles Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Assigned System Roles</h2>
                <p className="text-[11px] text-slate-500">Permissions and role privileges</p>
              </div>
            </div>

            {profile.roles && profile.roles.length > 0 ? (
              <div className="space-y-2">
                {profile.roles.map((role) => (
                  <div
                    key={role}
                    className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-xs font-bold text-slate-800">{role}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Assigned</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-600">No Roles Assigned</p>
                <p className="text-[11px] text-slate-400 mt-0.5">User has default basic privileges</p>
              </div>
            )}
          </div>

          {/* 3. Direct Reportees Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Direct Reportees ({profile.reportees?.length || 0})
                  </h2>
                  <p className="text-[11px] text-slate-500">Team members who report directly to {profile.fullName}</p>
                </div>
              </div>
            </div>

            {profile.reportees && profile.reportees.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {profile.reportees.map((reportee) => (
                  <Link
                    key={reportee.id}
                    to={ROUTES.USERS.PROFILE(getUserSlug(reportee))}
                    className="group p-3.5 bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {reportee.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {reportee.fullName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">{reportee.title || 'No Title'}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-2 transition-colors" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-600">No Direct Reportees</p>
                <p className="text-[11px] text-slate-400 mt-0.5">This user does not currently manage any team members</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* EDIT USER PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit User Details</h3>
                  <p className="text-[11px] text-slate-500">Update employee profile and credentials</p>
                </div>
              </div>

              <button
                type="button"
                onClick={cancelEdit}
                className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="m-5 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName ?? profile.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={editForm.title ?? profile.title ?? ''}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email ?? profile.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reporting Manager
                </label>
                <div className="relative">
                  <select
                    aria-label="Reporting Manager"
                    value={editForm.managerId !== undefined ? (editForm.managerId ?? '') : (profile.manager?.id ?? '')}
                    onChange={(e) => setField('managerId', e.target.value ? e.target.value : null)}
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

              {/* Active Account Status Toggle */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Account Active</span>
                  <span className="text-[11px] text-slate-500">
                    Inactive users cannot log in or submit tickets
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? profile.isActive}
                    onChange={(e) => setField('isActive', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default UserProfilePage;

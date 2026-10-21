import React, { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router';
import {
  Mail,
  Briefcase,
  Shield,
  Camera,
  Copy,
  Check,
  Users,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Laptop,
  History,
  KeyRound,
  User as UserIcon,
} from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuth } from '../../store/authStore';
import { ROUTES } from '../../constants';
import { useBreadcrumbStore } from '../../store/breadcrumbStore';
import { getUserSlug } from '../../utils/userUtils';
import { ActiveSessionsSection } from '../../components/user/ActiveSessionsSection';
import { LoginHistorySection } from '../../components/user/LoginHistorySection';
import { ChangePasswordSection } from '../../components/user/ChangePasswordSection';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const { user: currentUser } = useAuth();

  const {
    profile,
    loading,
    error,
    saving,
    uploadPicture,
    refetch,
  } = useUserProfile(userId);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number | undefined>(undefined);

  const isSelf = Boolean(
    currentUser &&
      profile &&
      (currentUser.id === profile.id ||
        currentUser.email.toLowerCase() === profile.email.toLowerCase())
  );

  const setTab = (tab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'profile') {
        next.delete('tab');
      } else {
        next.set('tab', tab);
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (profile?.email) {
      const slug = getUserSlug(profile);
      if (slug && userId !== slug) {
        const search = window.location.search;
        navigate(`${ROUTES.USERS.PROFILE(slug)}${search}`, { replace: true });
      }
    }
  }, [profile, userId, navigate]);

  React.useEffect(() => {
    if (profile?.fullName) {
      if (userId) useBreadcrumbStore.getState().setLabel(userId, profile.fullName);
      if (profile.id) useBreadcrumbStore.getState().setLabel(profile.id, profile.fullName);
      const slug = getUserSlug(profile);
      if (slug) useBreadcrumbStore.getState().setLabel(slug, profile.fullName);
    }
  }, [profile, userId]);

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
      <div data-testid="loading-skeleton" className="p-4 sm:p-6 lg:p-8 xl:p-10 w-full space-y-6">
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

  if (error) {
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
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6">

        {/* Tab Navigation for Self Settings */}
        {isSelf && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setTab('profile')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Profile Details</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('sessions')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Active Sessions</span>
              {typeof activeSessionsCount === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'sessions'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {activeSessionsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab('history')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Login History</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('security')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Security & Password</span>
            </button>
          </div>
        )}

        {/* Tab 1: Profile Details */}
        {(!isSelf || activeTab === 'profile') && (
          <div className="space-y-6">
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
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight truncate">
                      {profile.fullName}
                    </h2>

                    {(() => {
                      const isUserActive = profile.isActive ?? profile.active ?? true;
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isUserActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isUserActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null}
                          {isUserActive ? 'Active Employee' : 'Inactive'}
                        </span>
                      );
                    })()}
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
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Reporting Manager Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Reporting Manager</h2>
                    <p className="text-[11px] text-slate-500">Direct supervisor in organizational hierarchy</p>
                  </div>
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
                    <p className="text-[11px] text-slate-400 mt-0.5">This user is at root level of the org chart</p>
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
        )}

        {/* Tab 2: Active Sessions */}
        {isSelf && activeTab === 'sessions' && (
          <ActiveSessionsSection onSessionCountChange={setActiveSessionsCount} />
        )}

        {/* Tab 3: Login History */}
        {isSelf && activeTab === 'history' && (
          <LoginHistorySection />
        )}

        {/* Tab 4: Security & Change Password */}
        {isSelf && activeTab === 'security' && (
          <ChangePasswordSection
            otherSessionsCount={activeSessionsCount ? Math.max(0, activeSessionsCount - 1) : 0}
          />
        )}

      </div>
    </div>
  );
};
export default UserProfilePage;

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Mail,
  Briefcase,
  Building,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User as UserIcon,
  Network,
} from 'lucide-react';
import { getUserProfile } from '../../api/userApi';
import type { UserProfileResponse, UserSummaryDTO, User } from '../../types/user';
import { ROUTES } from '../../constants';
import { getUserInitial, getUserSlug } from '../../utils/userUtils';

export interface UserProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialUser?: Partial<User> | Partial<UserProfileResponse> | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  initialUser,
}) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(userId);
  const [history, setHistory] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'organization' | 'overview'>('organization');
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  // Sync activeUserId when userId prop changes and modal opens
  useEffect(() => {
    if (isOpen && userId) {
      setActiveUserId(userId);
      setHistory([]);
      setError(null);
    }
  }, [isOpen, userId]);

  // Fetch user profile whenever activeUserId changes
  useEffect(() => {
    if (!isOpen || !activeUserId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    getUserProfile(activeUserId)
      .then((data) => {
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || err?.message || 'Failed to load user profile');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeUserId]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavigateToUser = (targetUserId: string) => {
    if (activeUserId && activeUserId !== targetUserId) {
      setHistory((prev) => [...prev, activeUserId]);
      setActiveUserId(targetUserId);
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prevUserId = history[history.length - 1];
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setActiveUserId(prevUserId);
    }
  };

  const handleCopyEmail = useCallback((emailText: string) => {
    navigator.clipboard.writeText(emailText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }, []);

  if (!isOpen) return null;

  // Effective display data combining fetched profile and initial optimistic data
  const fullName = profile?.fullName || initialUser?.fullName || 'User Profile';
  const email = profile?.email || initialUser?.email || '';
  const title = profile?.title || initialUser?.title;
  const departmentName = profile?.departmentName || initialUser?.departmentName;
  const displayId = profile?.displayId || initialUser?.displayId;
  const profilePictureUrl = profile?.profilePictureUrl || initialUser?.profilePictureUrl;
  const initial = getUserInitial(fullName);
  const isActive = profile?.isActive ?? (initialUser as any)?.isActive ?? true;
  const fullProfileSlug = profile ? getUserSlug(profile) : activeUserId || '';
  const fullProfileUrl = fullProfileSlug ? ROUTES.USERS.PROFILE(fullProfileSlug) : '#';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teams-profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        data-testid="teams-profile-modal"
      >
        {/* Teams Header Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 h-28 sm:h-32 px-6 py-4 flex items-start justify-between shrink-0">
          {/* Back button when navigating inside hierarchy */}
          {history.length > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/20 transition-all cursor-pointer backdrop-blur-xs shadow-2xs"
              data-testid="profile-modal-back-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wider">
              <UserIcon className="w-4 h-4 text-indigo-300" />
              <span>Profile Card</span>
            </div>
          )}

          {/* Action buttons (Open full page & Close) */}
          <div className="flex items-center gap-2">
            {fullProfileSlug && (
              <a
                href={fullProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open full profile page"
                className="p-2 rounded-xl text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer backdrop-blur-xs"
                data-testid="profile-modal-external-link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-xl text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer backdrop-blur-xs"
              data-testid="profile-modal-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 pb-4 pt-0 border-b border-slate-100 shrink-0 bg-white relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-3">
            {/* Avatar with Status indicator */}
            <div className="relative inline-block shrink-0">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-md bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-2xl sm:text-3xl overflow-hidden bg-white">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
                title={isActive ? 'Active' : 'Inactive'}
              />
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2 sm:mb-2">
              {email && (
                <>
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                    title={`Send email to ${email}`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(email)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    title="Copy email address"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="teams-profile-modal-title"
                className="text-xl sm:text-2xl font-bold text-slate-900"
              >
                {fullName}
              </h2>
              {displayId && (
                <span className="font-mono text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                  {displayId}
                </span>
              )}
              <span
                className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600">
              {title && (
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {title}
                </span>
              )}
              {departmentName && (
                <span className="inline-flex items-center gap-1 font-medium text-indigo-700">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  {departmentName}
                </span>
              )}
              {email && (
                <span className="inline-flex items-center gap-1 text-slate-500 font-mono text-xs">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {email}
                </span>
              )}
            </div>
          </div>

          {/* Teams Tabs Header */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('organization')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'organization'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              data-testid="tab-organization"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Organization & Hierarchy</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              data-testid="tab-overview"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contact & Overview</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && !profile ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Loading profile and hierarchy details...</p>
            </div>
          ) : error && !profile ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <p className="text-sm font-semibold text-slate-800">{error}</p>
              <button
                type="button"
                onClick={() => {
                  if (activeUserId) {
                    setLoading(true);
                    getUserProfile(activeUserId)
                      .then(setProfile)
                      .catch((e) => setError(e.message))
                      .finally(() => setLoading(false));
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : activeTab === 'organization' ? (
            /* Microsoft Teams Style Hierarchy Graph */
            <div className="space-y-4" data-testid="hierarchy-graph-section">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-indigo-600" />
                  <span>Reporting Structure</span>
                </h3>
                <span className="text-2xs text-slate-500">
                  Click any person to explore reporting line
                </span>
              </div>

              {/* 1. Reports To (Manager) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Reports To
                </span>
                {profile?.manager ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigateToUser(profile.manager!.id)}
                    className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-indigo-50/40 hover:border-indigo-300 transition-all cursor-pointer shadow-xs"
                    data-testid="hierarchy-manager-card"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full border border-slate-200 bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                        {profile.manager.profilePictureUrl ? (
                          <img
                            src={profile.manager.profilePictureUrl}
                            alt={profile.manager.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{getUserInitial(profile.manager.fullName)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {profile.manager.fullName}
                          </span>
                          {profile.manager.displayId && (
                            <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                              {profile.manager.displayId}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {profile.manager.title || 'Manager'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {profile.manager.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 pl-2">
                      <span className="text-[11px] font-medium hidden sm:inline">View</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 text-center font-medium">
                    No manager assigned (Top level of organizational hierarchy)
                  </div>
                )}
              </div>

              {/* Vertical connector line */}
              <div className="flex justify-center py-0.5">
                <div className="w-0.5 h-6 bg-indigo-300 rounded-full" />
              </div>

              {/* 2. Current User (Selected Person) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Currently Viewing
                </span>
                <div
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-50/70 shadow-sm"
                  data-testid="hierarchy-current-user-card"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-500 ring-2 ring-indigo-200 bg-white text-indigo-700 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-2xs">
                      {profilePictureUrl ? (
                        <img
                          src={profilePictureUrl}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {fullName}
                        </span>
                        {displayId && (
                          <span className="font-mono text-2xs bg-white text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-bold">
                            {displayId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate">
                        {title || 'Employee'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{email}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-indigo-600 text-white shadow-2xs shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Selected</span>
                  </span>
                </div>
              </div>

              {/* Vertical connector line */}
              <div className="flex justify-center py-0.5">
                <div className="w-0.5 h-6 bg-indigo-300 rounded-full" />
              </div>

              {/* 3. Direct Reports */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Direct Reports ({profile?.reportees?.length || 0})
                  </span>
                </div>

                {profile?.reportees && profile.reportees.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="hierarchy-reportees-list">
                    {profile.reportees.map((reportee: UserSummaryDTO) => (
                      <div
                        key={reportee.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNavigateToUser(reportee.id)}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-200/90 bg-white hover:bg-indigo-50/40 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full border border-slate-200 bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {reportee.profilePictureUrl ? (
                              <img
                                src={reportee.profilePictureUrl}
                                alt={reportee.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{getUserInitial(reportee.fullName)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {reportee.fullName}
                            </h5>
                            <p className="text-[11px] text-slate-500 truncate">
                              {reportee.title || 'Team Member'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 ml-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 text-center font-medium">
                    No direct reports assigned
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Contact & Overview Tab */
            <div className="space-y-4" data-testid="overview-details-section">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Information */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Contact Info</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Full Name
                      </span>
                      <span className="font-semibold text-slate-800">{fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Email Address
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-800 break-all">{email || '—'}</span>
                        {email && (
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(email)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            title="Copy email"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Employee ID
                      </span>
                      <span className="font-mono text-slate-800">{displayId || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Organization Information */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Department & Roles</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Title / Role
                      </span>
                      <span className="font-semibold text-slate-800">{title || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Department
                      </span>
                      <span className="font-semibold text-slate-800">
                        {departmentName || 'Not Assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        System Privileges
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile?.roles && profile.roles.length > 0 ? (
                          profile.roles.map((r) => (
                            <span
                              key={r}
                              className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 font-semibold text-[10px] rounded-md shadow-2xs"
                            >
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">Standard Access</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Link to Profile */}
              <div className="pt-2 text-center">
                <a
                  href={fullProfileUrl}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>Open comprehensive profile in employee directory</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

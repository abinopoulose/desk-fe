import React, { useState, useEffect, useCallback } from 'react';
import {
  Laptop,
  Smartphone,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  RefreshCw,
  LogOut,
  CheckCircle2,
  MapPin,
  Clock,
  Wifi,
} from 'lucide-react';
import { getActiveSessions, terminateSession, terminateOtherSessions } from '../../api/sessionApi';
import type { UserSession } from '../../types/session';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ActiveSessionsSectionProps {
  onSessionCountChange?: (count: number) => void;
}

export const ActiveSessionsSection: React.FC<ActiveSessionsSectionProps> = ({ onSessionCountChange }) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal confirm states
  const [sessionToTerminate, setSessionToTerminate] = useState<UserSession | null>(null);
  const [isTerminatingOthers, setIsTerminatingOthers] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActiveSessions();
      setSessions(data);
      if (onSessionCountChange) {
        onSessionCountChange(data.length);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  }, [onSessionCountChange]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleTerminateOne = async () => {
    if (!sessionToTerminate) return;
    try {
      setTerminating(true);
      await terminateSession(sessionToTerminate.id);
      setActionSuccess(`Terminated session on ${sessionToTerminate.deviceInfo}`);
      setTimeout(() => setActionSuccess(null), 3000);
      setSessionToTerminate(null);
      await fetchSessions();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to terminate session');
    } finally {
      setTerminating(false);
    }
  };

  const handleTerminateOthers = async () => {
    try {
      setTerminating(true);
      const res = await terminateOtherSessions();
      setActionSuccess(res.message || 'All other sessions have been terminated.');
      setTimeout(() => setActionSuccess(null), 3000);
      setIsTerminatingOthers(false);
      await fetchSessions();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to terminate other sessions');
    } finally {
      setTerminating(false);
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const d = deviceInfo.toLowerCase();
    if (d.includes('phone') || d.includes('iphone') || d.includes('android')) {
      return <Smartphone className="w-5 h-5 text-indigo-600" />;
    }
    if (d.includes('mac') || d.includes('windows') || d.includes('linux')) {
      return <Laptop className="w-5 h-5 text-indigo-600" />;
    }
    return <Globe className="w-5 h-5 text-indigo-600" />;
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Active Logged-in Instances
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Devices and browsers currently authenticated to your account. You can terminate any unrecognized instance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void fetchSessions()}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh Sessions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {otherSessionsCount > 0 && (
            <button
              type="button"
              onClick={() => setIsTerminatingOthers(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminate All Other Sessions ({otherSessionsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && sessions.length === 0 ? (
        <div className="space-y-3">
          <div className="h-28 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
          <div className="h-28 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No active sessions found</h3>
          <p className="text-xs text-slate-400 mt-1">Please log in again or refresh the list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                session.isCurrent
                  ? 'border-indigo-300 bg-gradient-to-r from-indigo-50/30 to-white shadow-xs ring-1 ring-indigo-200/50'
                  : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    session.isCurrent ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {getDeviceIcon(session.deviceInfo)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{session.deviceInfo}</h3>
                    {session.isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        This Device (Current Session)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        Active Instance
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-700">{session.ipAddress}</span>
                    </span>

                    <span className="text-slate-300">•</span>

                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{session.location || 'Local Network'}</span>
                    </span>

                    <span className="text-slate-300">•</span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Signed in {formatDate(session.createdAt)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {session.isCurrent ? (
                  <span className="text-xs text-slate-400 italic px-2">Currently Active</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSessionToTerminate(session)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Terminate</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for single session */}
      {sessionToTerminate && (
        <ConfirmDialog
          open={Boolean(sessionToTerminate)}
          title="Terminate Session"
          description={`Are you sure you want to terminate the session on "${sessionToTerminate.deviceInfo}" (${sessionToTerminate.ipAddress})? That device will be immediately signed out and required to log in again.`}
          confirmLabel={terminating ? 'Terminating...' : 'Terminate Session'}
          cancelLabel="Cancel"
          severity="danger"
          loading={terminating}
          onConfirm={() => void handleTerminateOne()}
          onClose={() => setSessionToTerminate(null)}
        />
      )}

      {/* Confirmation Dialog for all other sessions */}
      {isTerminatingOthers && (
        <ConfirmDialog
          open={isTerminatingOthers}
          title="Terminate All Other Sessions"
          description={`This will immediately sign out all other ${otherSessionsCount} active session(s) across all other browsers and devices. Your current device will remain logged in.`}
          confirmLabel={terminating ? 'Terminating All...' : 'Terminate All Other Sessions'}
          cancelLabel="Cancel"
          severity="danger"
          loading={terminating}
          onConfirm={() => void handleTerminateOthers()}
          onClose={() => setIsTerminatingOthers(false)}
        />
      )}
    </div>
  );
};

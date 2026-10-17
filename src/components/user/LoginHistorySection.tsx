import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  RefreshCw,
  AlertTriangle,
  Globe,
  Smartphone,
  Laptop,
  CheckCircle2,
  XCircle,
  Clock,
  Wifi,
  MapPin,
} from 'lucide-react';
import { getLoginHistory } from '../../api/sessionApi';
import type { UserSession } from '../../types/session';

export const LoginHistorySection: React.FC = () => {
  const [history, setHistory] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLoginHistory();
      setHistory(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to load login history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const getDeviceIcon = (deviceInfo: string) => {
    const d = deviceInfo.toLowerCase();
    if (d.includes('phone') || d.includes('iphone') || d.includes('android')) {
      return <Smartphone className="w-4 h-4 text-slate-500" />;
    }
    if (d.includes('mac') || d.includes('windows') || d.includes('linux')) {
      return <Laptop className="w-4 h-4 text-slate-500" />;
    }
    return <Globe className="w-4 h-4 text-slate-500" />;
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

  const getStatusBadge = (session: UserSession) => {
    if (session.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Active
        </span>
      );
    }
    if (session.terminatedAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <XCircle className="w-3 h-3 text-amber-600" />
          Terminated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        Logged Out / Expired
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Login Activity & History</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {history.length} {history.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Audit history of authentication events including client IP, location, device signature, and session status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchHistory()}
          disabled={loading}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && history.length === 0 ? (
          <div className="p-8 space-y-3">
            <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
            <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
            <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No login history recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Device & Browser</th>
                  <th className="py-3 px-5">IP Address</th>
                  <th className="py-3 px-5">Location</th>
                  <th className="py-3 px-5">Sign-in Time</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getDeviceIcon(record.deviceInfo)}
                        </div>
                        <span className="truncate max-w-xs">{record.deviceInfo}</span>
                        {record.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Current
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-5 font-mono text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-slate-400" />
                        {record.ipAddress}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {record.location || 'Local Network'}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(record.createdAt)}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">{getStatusBadge(record)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

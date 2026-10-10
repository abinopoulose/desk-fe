import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export interface SLAIndicatorProps {
  createdAt: string;
  dueAt: string;
  breached: boolean;
  statusState: 'OPEN' | 'CLOSED';
}

export const SLAIndicator: React.FC<SLAIndicatorProps> = ({
  createdAt,
  dueAt,
  breached,
  statusState,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; mins: number; totalMs: number }>({
    hours: 0,
    mins: 0,
    totalMs: 0,
  });

  useEffect(() => {
    if (statusState === 'CLOSED' || !dueAt) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const due = new Date(dueAt).getTime();
      const diff = due - now;
      return {
        hours: Math.floor(Math.abs(diff) / (1000 * 60 * 60)),
        mins: Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60)),
        totalMs: diff,
      };
    };

    setTimeLeft(calculateTime());
    const interval = setInterval(() => setTimeLeft(calculateTime()), 60000);
    return () => clearInterval(interval);
  }, [dueAt, statusState]);

  if (statusState === 'CLOSED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
        <span>Resolved</span>
      </span>
    );
  }

  if (breached || timeLeft.totalMs < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold border border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        <span>Overdue by {timeLeft.hours}h {timeLeft.mins}m</span>
      </span>
    );
  }

  if (!dueAt) {
    return null;
  }

  const created = new Date(createdAt).getTime();
  const due = new Date(dueAt).getTime();
  const totalDuration = due - created;
  const isUrgent = timeLeft.totalMs < totalDuration / 2;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
      isUrgent
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
    }`}>
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-600' : 'text-indigo-600'}`} />
      <span>{timeLeft.hours}h {timeLeft.mins}m remaining</span>
    </span>
  );
};

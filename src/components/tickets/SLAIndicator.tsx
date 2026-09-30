import React, { useEffect, useState } from 'react';

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
    if (statusState === 'CLOSED') return;

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

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(calculateTime());
    const interval = setInterval(() => setTimeLeft(calculateTime()), 60000);
    return () => clearInterval(interval);
  }, [dueAt, statusState]);

  if (statusState === 'CLOSED') {
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Closed</span>;
  }

  if (breached || timeLeft.totalMs < 0) {
    return (
      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
        Breached by {timeLeft.hours}h {timeLeft.mins}m
      </span>
    );
  }

  const created = new Date(createdAt).getTime();
  const due = new Date(dueAt).getTime();
  const totalDuration = due - created;
  const isYellow = timeLeft.totalMs < totalDuration / 2;

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        isYellow ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
      }`}
    >
      Due in {timeLeft.hours}h {timeLeft.mins}m
    </span>
  );
};

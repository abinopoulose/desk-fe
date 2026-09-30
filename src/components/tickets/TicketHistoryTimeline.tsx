import React, { useState, useMemo } from 'react';
import type { AuditEntry, TimelineItem } from '../../types/audit';
import type { CommentDTO } from '../../types/ticket';
import { mergeTimeline } from '../../utils/timelineUtils';

export interface TicketHistoryTimelineProps {
  history: AuditEntry[];
  comments: CommentDTO[];
  className?: string;
  defaultSortOrder?: 'asc' | 'desc';
}

const IconStatus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
  </svg>
);

const IconChat = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
  </svg>
);

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
  </svg>
);

const timeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const getBadgeConfig = (type: TimelineItem['type']) => {
  switch (type) {
    case 'STATUS_CHANGE': return { icon: <IconStatus />, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' };
    case 'ASSIGNEE_CHANGE': return { icon: <IconUser />, bgColor: 'bg-green-100', iconColor: 'text-green-600' };
    case 'PRIORITY_CHANGE': return { icon: <IconAlert />, bgColor: 'bg-red-100', iconColor: 'text-red-600' };
    case 'COMMENT': return { icon: <IconChat />, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' };
    case 'FIELD_CHANGE':
    default: return { icon: <IconEdit />, bgColor: 'bg-gray-100', iconColor: 'text-gray-600' };
  }
};

import { SectionErrorBoundary } from '../errors/SectionErrorBoundary';

const TicketHistoryTimelineInner: React.FC<TicketHistoryTimelineProps> = ({
  history,
  comments,
  className = '',
  defaultSortOrder = 'asc',
}) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);

  const timelineItems = useMemo(() => {
    return mergeTimeline(history, comments, sortOrder);
  }, [history, comments, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Timeline</h3>
        <button
          onClick={toggleSortOrder}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors border border-gray-200 shadow-sm"
        >
          Sort: {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
        </button>
      </div>

      <div className="relative pl-4 overflow-y-auto max-h-[600px] pr-2">
        {/* Continuous Vertical Line */}
        <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-200 z-0"></div>

        {timelineItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8 italic">No history available.</div>
        ) : (
          <ul className="space-y-6 relative z-10">
            {timelineItems.map((item) => {
              const { icon, bgColor, iconColor } = getBadgeConfig(item.type);
              
              // Actor avatar fallback
              const initials = item.actor.fullName
                ? item.actor.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'U';

              return (
                <li key={item.id} className="flex gap-4 items-start">
                  {/* Badge Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bgColor} ${iconColor} shadow-sm border border-white ring-4 ring-white`}>
                    {icon}
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {/* Avatar */}
                        {item.actor.avatarUrl ? (
                          <img src={item.actor.avatarUrl} alt={item.actor.fullName} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {initials}
                          </div>
                        )}
                        <span className="font-medium text-sm text-gray-900">{item.actor.fullName}</span>
                      </div>
                      
                      {/* Timestamp */}
                      <span 
                        className="text-xs text-gray-500 cursor-help"
                        title={new Date(item.timestamp).toLocaleString()}
                      >
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700">{item.summary}</p>
                    
                    {/* Extra Details (Comments / large JSON) */}
                    {item.details && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 whitespace-pre-wrap">
                        {item.details}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export const TicketHistoryTimeline: React.FC<TicketHistoryTimelineProps> = (props) => (
  <SectionErrorBoundary sectionName="ticket timeline">
    <TicketHistoryTimelineInner {...props} />
  </SectionErrorBoundary>
);

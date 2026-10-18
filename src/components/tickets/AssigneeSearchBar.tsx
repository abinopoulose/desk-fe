import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, User as UserIcon, UserX, ChevronsUpDown } from 'lucide-react';
import { Link } from 'react-router';
import { ROUTES } from '../../constants';
import { getUserInitial, getUserSlug } from '../../utils/userUtils';
import type { User } from '../../types/user';

export interface AssigneeSummary {
  id: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  displayId?: string;
}

export interface AssigneeSearchBarProps {
  assignee?: AssigneeSummary | null;
  availableAssignees?: User[];
  canManage: boolean;
  onAssigneeChange: (assigneeId: string | null) => void;
}

export const UserAvatar: React.FC<{
  fullName: string;
  email?: string;
  profilePictureUrl?: string;
  size?: 'sm' | 'md';
}> = ({ fullName, email, profilePictureUrl, size = 'sm' }) => {
  const [imageError, setImageError] = useState(false);
  const sizeClasses = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm';

  if (profilePictureUrl && !imageError) {
    return (
      <img
        src={profilePictureUrl}
        alt={fullName}
        onError={() => setImageError(true)}
        className={`${sizeClasses} rounded-full object-cover shrink-0 border border-slate-200/80 shadow-2xs`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-2xs`}
    >
      {getUserInitial(fullName || email || 'U')}
    </div>
  );
};

export const AssigneeSearchBar: React.FC<AssigneeSearchBarProps> = ({
  assignee,
  availableAssignees = [],
  canManage,
  onAssigneeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter top 5 employees only matching search query (name or email)
  const filteredEmployees = useMemo(() => {
    const active = availableAssignees.filter(
      (u) => (u as any).status !== 'INACTIVE' && (u as any).isActive !== false
    );
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return active.slice(0, 5);
    }
    return active
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [availableAssignees, searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (userId: string | null) => {
    setIsOpen(false);
    setSearchQuery('');
    onAssigneeChange(userId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  if (!canManage) {
    if (assignee) {
      return (
        <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
          <UserAvatar
            fullName={assignee.fullName}
            email={assignee.email}
            profilePictureUrl={assignee.profilePictureUrl}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <Link
              to={ROUTES.USERS.PROFILE(getUserSlug(assignee))}
              className="text-xs font-semibold text-slate-800 hover:text-indigo-600 hover:underline truncate block"
            >
              {assignee.fullName}
            </Link>
            <p className="text-[11px] text-slate-400 truncate">{assignee.email}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-semibold flex items-center gap-2">
        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400 italic">Unassigned</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button: Shows current assignee or Unassigned */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-xl text-left transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {assignee ? (
            <>
              <UserAvatar
                fullName={assignee.fullName}
                email={assignee.email}
                profilePictureUrl={assignee.profilePictureUrl}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {assignee.fullName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{assignee.email}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-dashed border-slate-300 text-slate-400 flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600">Unassigned</p>
                <p className="text-[11px] text-slate-400">Click to search & assign</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center text-slate-400 group-hover:text-slate-600 shrink-0 ml-2">
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Jira-style Search Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
          role="listbox"
        >
          {/* Search bar input like in Jira */}
          <div className="relative flex items-center px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              placeholder="Search employees by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {/* Unassign option */}
            {(!searchQuery || 'unassigned'.includes(searchQuery.toLowerCase())) && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer group ${
                  !assignee ? 'bg-indigo-50/80 text-indigo-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                }`}
                role="option"
                aria-selected={!assignee}
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-dashed border-slate-300 text-slate-400 flex items-center justify-center shrink-0">
                  <UserX className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                    Unassigned
                  </div>
                  <div className="text-[11px] text-slate-400">Clear ticket assignee</div>
                </div>
                {!assignee && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
              </button>
            )}

            {/* Section label */}
            <div className="px-2 pt-1.5 pb-1 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{searchQuery ? 'Top Results' : 'Suggested Employees'}</span>
              <span>{filteredEmployees.length} of {Math.min(5, availableAssignees.length)}</span>
            </div>

            {/* Top 5 Employees Only - showing name, email, profile picture ONLY (no designations) */}
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((u) => {
                const isSelected = assignee?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <UserAvatar
                      fullName={u.fullName}
                      email={u.email}
                      profilePictureUrl={u.profilePictureUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {u.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                No employees found matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

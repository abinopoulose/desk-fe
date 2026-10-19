import React from 'react';
import { APP_NAME } from '../../constants';

export interface LogoIconProps {
  size?: number | string;
  className?: string;
  badge?: boolean;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 40,
  className = '',
  badge = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`${APP_NAME} logo`}
    >
      <defs>
        <linearGradient id="desk-brand-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#4338CA" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient id="desk-brand-arc" x1="12" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="45%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        <linearGradient id="desk-brand-spine" x1="12" y1="11" x2="18" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C7D2FE" />
        </linearGradient>
      </defs>

      {/* Optional Sleek Squircle Container */}
      {badge && (
        <>
          <rect width="48" height="48" rx="12" fill="url(#desk-brand-bg)" />
          <rect
            x="0.75"
            y="0.75"
            width="46.5"
            height="46.5"
            rx="11.25"
            stroke="#818CF8"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
        </>
      )}

      {/* Left Anchor Spine */}
      <rect x="12" y="11" width="5.5" height="26" rx="2.75" fill="url(#desk-brand-spine)" />

      {/* Dimensional D Arc */}
      <path
        d="M16 11H26C33.732 11 40 16.82 40 24C40 31.18 33.732 37 26 37H16"
        stroke="url(#desk-brand-arc)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Forward Workspace Shelf / Ticket Flow Tier */}
      <path
        d="M16 24H28C30.2091 24 32 22.2091 32 20C32 17.7909 30.2091 16 28 16H20"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  );
};

export interface LogoProps {
  size?: number | string;
  showText?: boolean;
  subtitle?: string;
  badge?: boolean;
  textColor?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 40,
  showText = true,
  subtitle = 'Enterprise Hub',
  badge = true,
  textColor = 'text-white',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LogoIcon size={size} badge={badge} />
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-base font-extrabold tracking-tight leading-tight ${textColor}`}>
              {APP_NAME}
            </span>
            {subtitle && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

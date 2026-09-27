import React from 'react';
import { useAuthStore } from '../../store/authStore';

export interface PrivilegeGateProps {
  requiredPrivilege?: string;
  requiredPrivileges?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PrivilegeGate: React.FC<PrivilegeGateProps> = ({
  requiredPrivilege,
  requiredPrivileges,
  requireAll = false,
  children,
  fallback = null,
}) => {
  const privileges = useAuthStore((state) => state.privileges);

  const reqPrivs = requiredPrivileges || (requiredPrivilege ? [requiredPrivilege] : []);

  if (reqPrivs.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? reqPrivs.every((p) => privileges.includes(p))
    : reqPrivs.some((p) => privileges.includes(p));

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

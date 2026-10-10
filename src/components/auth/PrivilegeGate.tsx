import React from 'react';
import { useAuth } from '../../store/authStore';

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
  const { hasPrivilege } = useAuth();

  const reqPrivs = requiredPrivileges || (requiredPrivilege ? [requiredPrivilege] : []);

  if (reqPrivs.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? reqPrivs.every((p) => hasPrivilege(p))
    : reqPrivs.some((p) => hasPrivilege(p));

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { getSubdomain, buildTenantUrl } from '../../utils/subdomain';

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, token } = useAuthStore();
  const location = useLocation();
  const currentSubdomain = getSubdomain();
  const firmSubdomain = user?.organizationSubdomain;

  useEffect(() => {
    if (isAuthenticated && firmSubdomain && !currentSubdomain) {
      window.location.href = buildTenantUrl(firmSubdomain, location.pathname, token || undefined);
    }
  }, [isAuthenticated, firmSubdomain, currentSubdomain, location.pathname, token]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (firmSubdomain && !currentSubdomain) {
    return null;
  }

  return children ? <>{children}</> : <Outlet />;
};

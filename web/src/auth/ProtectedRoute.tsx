import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useCurrentUser } from './AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useCurrentUser();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/sign-in" replace state={{ returnTo: location.pathname }} />;
  }

  return <Outlet />;
}

ProtectedRoute.displayName = 'ProtectedRoute';

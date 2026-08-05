import { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../lib/auth-storage';

interface ProtectedRouteProps {
  children?: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;